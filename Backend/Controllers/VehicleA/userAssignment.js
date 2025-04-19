import db from "../../database.js";
import { scanningLogger } from "../../Services/logger.js";
import { allClients, broadcastToAll } from "../../Websockets/serverSocket1.js";
import transporter from "../../Services/mailSender.js";
import getFormattedGMT8 from "../../Services/dateFormatter.js";

async function getUserIdFromRfidOrNfc(rfidOrNfc) {
  const userQuery = await db
    .collection("UserRFID")
    .where("rfid", "==", rfidOrNfc)
    .limit(1)
    .get();

  return !userQuery.empty
    ? userQuery.docs[0].id
    : (
        await db
          .collection("UserRFID")
          .where("nfc", "==", rfidOrNfc)
          .limit(1)
          .get()
      ).docs[0]?.id || null;
}

async function generateTransactionId(userId) {
  const transactionsRef = db.collection("UserTransaction").doc(userId);
  const transactionsDoc = await transactionsRef.get();

  if (!transactionsDoc.exists) {
    await transactionsRef.set({});
    return "TX-0001";
  }

  const transactionIds = Object.keys(transactionsDoc.data());
  if (transactionIds.length === 0) {
    return "TX-0001";
  }

  const lastId = transactionIds.sort().pop();
  const nextNum = parseInt(lastId.split("-")[1]) + 1;
  return `TX-${nextNum.toString().padStart(4, "0")}`;
}

async function calculateFare(pickupStop, dropoffStop) {
  try {
    const routeDoc = await db.collection("Route").doc("Route1").get();
    if (!routeDoc.exists) {
      scanningLogger.error("Route document not found");
      return 0;
    }

    const routeData = routeDoc.data();
    const stops = [
      routeData.Stop1,
      routeData.Stop2,
      routeData.Stop3,
      routeData.Stop4,
      routeData.Stop5,
      routeData.Stop6,
    ].filter((stop) => stop);

    const pickupIndex = stops.findIndex((stop) => stop === pickupStop);
    const dropoffIndex = stops.findIndex((stop) => stop === dropoffStop);

    if (pickupIndex === -1 || dropoffIndex === -1) {
      scanningLogger.error(`Invalid stops: ${pickupStop} or ${dropoffStop}`);
      return 0;
    }

    const stopsPassed = Math.abs(dropoffIndex - pickupIndex);
    return 13 + stopsPassed * 10;
  } catch (error) {
    scanningLogger.error(`Failed to calculate fare: ${error.message}`);
    return 0;
  }
}

async function checkUserLoanStatus(userId) {
  try {
    const walletRef = db.collection("UserWallet").doc(userId);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      await walletRef.set({ balance: 0, loanAmount: 0, loaned: false });
      return { hasLoan: false, loanAmount: 0 };
    }

    const walletData = walletDoc.data();
    return {
      hasLoan: walletData.loaned && walletData.loanAmount > 0,
      loanAmount: walletData.loanAmount || 0,
    };
  } catch (error) {
    scanningLogger.error(`Failed to check loan status: ${error.message}`);
    return { hasLoan: false, loanAmount: 0 };
  }
}

async function processPayment(userId, amount) {
  try {
    const walletRef = db.collection("UserWallet").doc(userId);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      await walletRef.set({ balance: 0, loanAmount: 0, loaned: false });
    }

    const walletData = walletDoc.exists
      ? walletDoc.data()
      : { balance: 0, loanAmount: 0, loaned: false };
    const currentBalance = walletData.balance || 0;

    if (currentBalance >= amount) {
      await walletRef.update({
        balance: currentBalance - amount,
        lastUpdated: getFormattedGMT8(),
      });
      return {
        success: true,
        paymentStatus: "full",
        amountPaid: amount,
        loanAmount: 0,
        remainingBalance: currentBalance - amount,
      };
    } else {
      const loanAmount = amount - currentBalance;
      await walletRef.update({
        balance: 0,
        loanAmount: (walletData.loanAmount || 0) + loanAmount,
        loaned: true,
        lastUpdated: getFormattedGMT8(),
      });
      return {
        success: true,
        paymentStatus: "partial",
        amountPaid: currentBalance,
        loanAmount,
        remainingBalance: 0,
      };
    }
  } catch (error) {
    scanningLogger.error(`Payment processing failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function recordTransaction(
  userId,
  userName,
  assignmentData,
  vehicle,
  paymentResult
) {
  try {
    const transactionId = await generateTransactionId(userId);
    const transactionRef = db.collection("UserTransaction").doc(userId);

    const transactionData = {
      currentBalance: paymentResult.remainingBalance,
      dateTime: getFormattedGMT8(),
      discount: false,
      dropoff: assignmentData.dropoffStop,
      loaned: paymentResult.loanAmount > 0,
      loanedAmount: paymentResult.loanAmount,
      pickup: assignmentData.pickupStop,
      remainingBalance: paymentResult.remainingBalance,
      totalAmount: paymentResult.amountPaid + paymentResult.loanAmount,
      userName: userName,
      vehicle: vehicle,
      status: "completed",
      paymentStatus: paymentResult.paymentStatus,
    };

    await transactionRef.update({
      [transactionId]: transactionData,
    });

    return {
      transactionId,
      totalAmount: transactionData.totalAmount,
      paymentResult,
    };
  } catch (error) {
    scanningLogger.error(`Failed to record transaction: ${error.message}`);
    return null;
  }
}

async function sendDropoffReceipt(
  email,
  userName,
  assignmentData,
  vehicle,
  transactionId,
  totalAmount,
  paymentResult
) {
  try {
    const formattedAmount = totalAmount.toFixed(2);
    const paymentStatus =
      paymentResult.paymentStatus === "full"
        ? `FULLY PAID (£${formattedAmount})`
        : `PARTIALLY PAID (£${paymentResult.amountPaid.toFixed(
            2
          )}) - LOAN: £${paymentResult.loanAmount.toFixed(2)}`;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: `Your ${vehicle.toUpperCase()} Journey Receipt`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #0056b3; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #0056b3; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">${vehicle.toUpperCase()} JOURNEY RECEIPT</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">PASSENGER</div>
                <div style="font-weight: bold; font-size: 18px;">${userName.toUpperCase()}</div>
              </div>
              <div style="text-align: right; margin-left: 225px;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">TRANSACTION ID</div>
                <div style="font-weight: bold; font-size: 18px;">${transactionId}</div>
              </div>
            </div>
            
            <div style="background-color: #f5f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: left;">
                  <div style="color: black; font-size: 12px; margin-bottom: 3px;">DATE</div>
                  <div style="font-weight: bold;">${assignmentData.pickupTime
                    .split(" ")[0]
                    .replace(/-/g, " ")}</div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <div style="color: black; font-size: 12px; margin-bottom: 3px;">FROM</div>
                  <div style="font-weight: bold;">${assignmentData.pickupStop.toUpperCase()}</div>
                </div>
                <div style="text-align: right; margin-left: 20px;">
                  <div style="color: black; font-size: 12px; margin-bottom: 3px;">TO</div>
                  <div style="font-weight: bold;">${assignmentData.dropoffStop.toUpperCase()}</div>
                </div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px; margin-right: 30px;">BOARDING TIME</div>
                <div style="font-weight: bold;">10:45 AM</div>
              </div>
              <div style="flex: 1; text-align: left;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px; margin-right: 30px;">SEAT</div>
                <div style="font-weight: bold;">AA</div>
              </div>
              <div style="flex: 1; text-align: left;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">GATE</div>
                <div style="font-weight: bold;">B1</div>
              </div>
            </div>
            
            <div style="border-top: 2px dashed #ccc; padding-top: 15px; text-align: center;">
              <div style="margin-bottom: 10px;">
                <div style="color: black; font-size: 12px;">FARE</div>
                <div style="font-weight: bold; font-size: 20px; color: #0056b3;">£${formattedAmount}</div>
                <div style="font-size: 12px; margin-top: 5px; color: ${
                  paymentResult.paymentStatus === "partial"
                    ? "#ff0000"
                    : "#00aa00"
                }">
                  ${paymentStatus}
                </div>
              </div>
              <div style="background-color: #f0f0f0; padding: 10px; display: inline-block; margin-bottom: 15px;">
                <div style="font-family: 'Courier New', monospace; letter-spacing: 3px; font-weight: bold;">${transactionId.replace(
                  "TX-",
                  ""
                )}</div>
              </div>
            </div>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: black; border-top: 1px solid #ddd;">
            <div>Printed on ${new Date()
              .toLocaleString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toUpperCase()}</div>
            <div style="margin-top: 10px; color: #0056b3; font-weight: bold;">Thank you for traveling with us</div>
          </div>
        </div>
        
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto 0; font-size: 12px; color: black; line-height: 1.5;">
          <p>If you have any questions about your journey, please contact our customer service.</p>
          <p>This is an automated email - please do not reply directly to this message.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    scanningLogger.info(`Receipt email sent to ${email}`);
  } catch (error) {
    scanningLogger.error(`Failed to send receipt email: ${error.message}`);
  }
}

export async function assignPickupOrDropoff(rfidOrNfc) {
  const timestamp = getFormattedGMT8();
  scanningLogger.info(`Processing RFID/NFC: ${rfidOrNfc} at ${timestamp}`);

  try {
    const userId = await getUserIdFromRfidOrNfc(rfidOrNfc);
    if (!userId) {
      scanningLogger.warn(`Unrecognized RFID/NFC: ${rfidOrNfc}`);
      return { status: "USER_NOT_FOUND" };
    }

    const userDoc = await db.collection("Users").doc(userId).get();
    if (!userDoc.exists) {
      scanningLogger.warn(`Missing user document: ${userId}`);
      return { status: "USER_DOCUMENT_NOT_FOUND" };
    }

    const userData = userDoc.data();
    const userName =
      userData.name || `${userData.firstName} ${userData.lastName}`;

    const { hasLoan, loanAmount } = await checkUserLoanStatus(userId);
    if (hasLoan) {
      scanningLogger.warn(`User ${userId} has existing loan of £${loanAmount}`);
      return {
        status: "LOAN_OUTSTANDING",
        message: "Please pay your existing loan first",
        loanAmount,
      };
    }

    const currentTrainDoc = await db
      .collection("TrainSimulation")
      .doc("CurrentPosition")
      .get();

    if (!currentTrainDoc.exists || !currentTrainDoc.data().stopName) {
      scanningLogger.error("Invalid train position data");
      return { status: "TRAIN_POSITION_INVALID" };
    }

    const { stopName, vehicle: currentVehicle = "a" } = currentTrainDoc.data();
    const assignmentsCollection = db.collection("UserAssignments");

    const activeTripsQuery = await assignmentsCollection
      .where("userId", "==", userId)
      .where("status", "in", ["awaiting_dropoff", "in_progress"])
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!activeTripsQuery.empty) {
      const activeTripDoc = activeTripsQuery.docs[0];
      const activeTrip = activeTripDoc.data();
      const assignmentRef = assignmentsCollection.doc(activeTripDoc.id);

      if (activeTrip.vehicle !== currentVehicle) {
        scanningLogger.warn(
          `Vehicle mismatch for ${userName} (${activeTrip.vehicle} vs ${currentVehicle})`
        );
        return {
          status: "ACTIVE_TRIP_ON_ANOTHER_VEHICLE",
          currentVehicle,
          activeTripVehicle: activeTrip.vehicle,
          message: "Cannot switch vehicles mid-trip",
        };
      }

      let action, assignmentData;

      if (
        activeTrip.status === "awaiting_dropoff" &&
        activeTrip.pickupStop === stopName
      ) {
        assignmentData = {
          status: "in_progress",
          updatedAt: timestamp,
        };
        action = `PICKUP_${currentVehicle.toUpperCase()}_CONFIRMED`;
      } else {
        assignmentData = {
          dropoffStop: stopName,
          dropoffTime: timestamp,
          status: "completed",
          completedAt: timestamp,
          updatedAt: timestamp,
        };
        action = `DROPOFF_${currentVehicle.toUpperCase()}`;

        if (userData.email) {
          const totalAmount = await calculateFare(
            activeTrip.pickupStop,
            stopName
          );

          const paymentResult = await processPayment(userId, totalAmount);

          if (!paymentResult.success) {
            scanningLogger.error(`Payment failed for user ${userId}`);
            return {
              status: "PAYMENT_FAILED",
              message: "Payment processing failed",
              error: paymentResult.error,
            };
          }

          const { transactionId, totalAmount: actualAmount } =
            await recordTransaction(
              userId,
              userName,
              { ...activeTrip, ...assignmentData },
              currentVehicle,
              paymentResult
            );

          await sendDropoffReceipt(
            userData.email,
            userName,
            { ...activeTrip, ...assignmentData },
            currentVehicle,
            transactionId,
            actualAmount,
            paymentResult
          );
        }
      }

      await assignmentRef.update(assignmentData);
      const updatedAssignment = { ...activeTrip, ...assignmentData };

      const wsMessage = {
        type: "TRIP_UPDATE",
        data: {
          rfidOrNfc,
          userId,
          userName,
          action,
          timestamp,
          stopName,
          status: updatedAssignment.status,
          pickupStop: updatedAssignment.pickupStop,
          pickupTime: updatedAssignment.pickupTime,
          dropoffStop: updatedAssignment.dropoffStop,
          dropoffTime: updatedAssignment.dropoffTime,
          assignmentId: assignmentRef.id,
          vehicle: currentVehicle,
        },
      };

      broadcastToAll(null, JSON.stringify(wsMessage), allClients);

      return {
        status: "ASSIGNED",
        action,
        timestamp,
        assignmentData: updatedAssignment,
        assignmentId: assignmentRef.id,
        user: { ...userData, documentId: userId },
        vehicle: currentVehicle,
      };
    }

    if (currentVehicle === "b") {
      const completedATrip = await assignmentsCollection
        .where("userId", "==", userId)
        .where("vehicle", "==", "a")
        .where("status", "==", "completed")
        .limit(1)
        .get();

      if (completedATrip.empty) {
        scanningLogger.warn(`User ${userName} needs completed A trip before B`);
        return { status: "VEHICLE_A_REQUIRED_FIRST" };
      }
    }

    const assignmentRef = assignmentsCollection.doc();
    const action = `PICKUP_${currentVehicle.toUpperCase()}`;
    const assignmentData = {
      userId,
      userName,
      vehicle: currentVehicle,
      pickupStop: stopName,
      pickupTime: timestamp,
      dropoffStop: null,
      dropoffTime: null,
      status: "awaiting_dropoff",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await assignmentRef.set(assignmentData);

    const wsMessage = {
      type: "TRIP_UPDATE",
      data: {
        rfidOrNfc,
        userId,
        userName,
        action,
        timestamp,
        stopName,
        status: assignmentData.status,
        pickupStop: assignmentData.pickupStop,
        pickupTime: assignmentData.pickupTime,
        dropoffStop: assignmentData.dropoffStop,
        dropoffTime: assignmentData.dropoffTime,
        assignmentId: assignmentRef.id,
        vehicle: currentVehicle,
      },
    };

    broadcastToAll(null, JSON.stringify(wsMessage), allClients);

    return {
      status: "ASSIGNED",
      action,
      timestamp,
      assignmentData,
      assignmentId: assignmentRef.id,
      user: { ...userData, documentId: userId },
      vehicle: currentVehicle,
    };
  } catch (error) {
    scanningLogger.error(`Processing error: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}
