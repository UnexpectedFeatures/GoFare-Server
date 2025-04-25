import db from "../../database.js";
import { terminal1Logger } from "../../Services/logger.js";
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

async function updateGlobalBankConversion(amountGBP) {
  try {
    const conversionRef = db.collection("GlobalBank").doc("Conversion");
    const conversionDoc = await conversionRef.get();

    if (!conversionDoc.exists) {
      terminal1Logger.warn("GlobalBank Conversion document not found");
      await conversionRef.set({
        PHP: 0,
        lastUpdated: getFormattedGMT8(),
      });
      return;
    }

    const currentPHP = conversionDoc.data().PHP || 0;
    const amountPHP = amountGBP;
    const newPHPValue = currentPHP + amountPHP;

    await conversionRef.update({
      PHP: newPHPValue,
      lastUpdated: getFormattedGMT8(),
    });

    terminal1Logger.info(
      `Added ₱${amountGBP.toFixed(
        2
      )} to PHP value (New total: ₱${newPHPValue.toFixed(2)})`
    );
  } catch (error) {
    terminal1Logger.error(
      `Failed to update GlobalBank conversion: ${error.message}`
    );
  }
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

async function getActiveEventDiscount() {
  try {
    const eventsSnapshot = await db.collection("Events").get();
    let maxDiscount = 0;

    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data();
      if (
        eventData.discountPercentage &&
        typeof eventData.discountPercentage === "number"
      ) {
        maxDiscount = Math.max(maxDiscount, eventData.discountPercentage);
      }
    });

    return maxDiscount;
  } catch (error) {
    terminal1Logger.error(`Failed to fetch event discounts: ${error.message}`);
    return 0;
  }
}

async function calculateFare(pickupStop, dropoffStop, userId) {
  try {
    let hasDiscount = false;
    let eventDiscount = 0;

    if (userId) {
      const walletDoc = await db.collection("UserWallet").doc(userId).get();
      if (walletDoc.exists) {
        hasDiscount = walletDoc.data().discount || false;
      }

      eventDiscount = await getActiveEventDiscount();
    }

    const routeDoc = await db.collection("Route").doc("Route1").get();
    if (!routeDoc.exists) {
      terminal1Logger.error("Route document not found");
      return {
        fare: 0,
        originalFare: 0,
        discountApplied: false,
        discountDetails: [],
      };
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
      terminal1Logger.error(`Invalid stops: ${pickupStop} or ${dropoffStop}`);
      return {
        fare: 0,
        originalFare: 0,
        discountApplied: false,
        discountDetails: [],
      };
    }

    const stopsPassed = Math.abs(dropoffIndex - pickupIndex);
    let fare = 13 + stopsPassed * 10;
    const originalFare = fare;
    let discountApplied = false;
    let discountDetails = [];

    if (hasDiscount) {
      const discountAmount = fare * 0.1;
      fare -= discountAmount;
      discountApplied = true;
      discountDetails.push({
        type: "Regular Discount",
        percentage: 10,
        amount: discountAmount,
      });
    }

    if (eventDiscount > 0) {
      const discountAmount = originalFare * (eventDiscount / 100);
      fare -= discountAmount;
      discountApplied = true;
      discountDetails.push({
        type: "Event Discount",
        percentage: eventDiscount,
        amount: discountAmount,
      });
    }

    if (discountApplied) {
      terminal1Logger.info(
        `Applied discounts for user ${userId}: ${JSON.stringify(
          discountDetails
        )}`
      );
    }

    return {
      fare,
      originalFare,
      discountApplied,
      discountDetails,
    };
  } catch (error) {
    terminal1Logger.error(`Failed to calculate fare: ${error.message}`);
    return {
      fare: 0,
      originalFare: 0,
      discountApplied: false,
      discountDetails: [],
    };
  }
}

async function checkUserLoanStatus(userId) {
  try {
    const walletRef = db.collection("UserWallet").doc(userId);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      await walletRef.set({ balance: 0, loanedAmount: 0, loaned: false });
      return { hasLoan: false, loanedAmount: 0 };
    }

    const walletData = walletDoc.data();
    return {
      hasLoan: walletData.loaned && walletData.loanedAmount > 0,
      loanedAmount: walletData.loanedAmount || 0,
    };
  } catch (error) {
    terminal1Logger.error(`Failed to check loan status: ${error.message}`);
    return { hasLoan: false, loanedAmount: 0 };
  }
}

async function processPayment(userId, amount) {
  try {
    const walletRef = db.collection("UserWallet").doc(userId);
    const walletDoc = await walletRef.get();

    if (!walletDoc.exists) {
      await walletRef.set({ balance: 0, loanedAmount: 0, loaned: false });
    }

    const walletData = walletDoc.exists
      ? walletDoc.data()
      : { balance: 0, loanedAmount: 0, loaned: false };
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
        loanedAmount: 0,
        remainingBalance: currentBalance - amount,
      };
    } else {
      const loanedAmount = amount - currentBalance;
      await walletRef.update({
        balance: 0,
        loanedAmount: (walletData.loanedAmount || 0) + loanedAmount,
        loaned: true,
        lastUpdated: getFormattedGMT8(),
      });
      return {
        success: true,
        paymentStatus: "partial",
        amountPaid: currentBalance,
        loanedAmount,
        remainingBalance: 0,
      };
    }
  } catch (error) {
    terminal1Logger.error(`Payment processing failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function recordTransaction(
  userId,
  userName,
  assignmentData,
  vehicle,
  paymentResult,
  originalFare,
  discountDetails
) {
  try {
    const transactionId = await generateTransactionId(userId);
    const transactionRef = db.collection("UserTransaction").doc(userId);

    const totalAmount = paymentResult.amountPaid + paymentResult.loanedAmount;

    await updateGlobalBankConversion(totalAmount);

    const walletDoc = await db.collection("UserWallet").doc(userId).get();
    const hasDiscount = walletDoc.exists
      ? walletDoc.data().discount ?? false
      : false;

    const transactionData = {
      currentBalance: paymentResult.remainingBalance,
      dateTime: getFormattedGMT8(),
      discount: hasDiscount,
      discountDetails: discountDetails,
      dropoff: assignmentData.dropoffStop,
      loaned: paymentResult.loanedAmount > 0,
      loanedAmount: paymentResult.loanedAmount,
      pickup: assignmentData.pickupStop,
      remainingBalance: paymentResult.remainingBalance,
      totalAmount: totalAmount,
      originalFare: originalFare,
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
      totalAmount,
      originalFare,
      paymentResult,
      discountDetails,
      success: true,
    };
  } catch (error) {
    terminal1Logger.error(`Failed to record transaction: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function sendDropoffReceipt(
  email,
  userName,
  assignmentData,
  vehicle,
  transactionId,
  totalAmount,
  paymentResult,
  originalFare,
  discountDetails
) {
  try {
    const formattedAmount = totalAmount.toFixed(2);
    const formattedOriginalAmount = originalFare.toFixed(2);

    const paymentStatus =
      paymentResult.paymentStatus === "full"
        ? `FULLY PAID (₱${formattedAmount})`
        : `PARTIALLY PAID (₱${paymentResult.amountPaid.toFixed(
            2
          )}) - LOAN: ₱${paymentResult.loanedAmount.toFixed(2)}`;

    const dropoffDateTime = new Date(assignmentData.dropoffTime);
    const formattedDate = dropoffDateTime
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
    const formattedTime = dropoffDateTime
      .toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();

    let discountHtml = "";
    if (discountDetails.length > 0) {
      discountHtml = `
        <div style="margin-bottom: 10px;">
          <div style="color: black; font-size: 12px;">ORIGINAL FARE</div>
          <div style="font-weight: bold; font-size: 18px; text-decoration: line-through; color: #777;">₱${formattedOriginalAmount}</div>
        </div>
      `;

      discountDetails.forEach((discount) => {
        discountHtml += `
          <div style="margin-bottom: 10px;">
            <div style="color: black; font-size: 12px;">${discount.type} (${
          discount.percentage
        }%)</div>
            <div style="font-weight: bold; font-size: 18px; color: #00aa00;">-₱${discount.amount.toFixed(
              2
            )}</div>
          </div>
        `;
      });
    }

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: `Your GoFare Receipt`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #0056b3; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #0056b3; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">GoFare Receipt</h1>
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
                  <div style="font-weight: bold;">${formattedDate}</div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <div style="color: black; font-size: 12px; margin-bottom: 3px;">FROM</div>
                  <div style="font-weight: bold;">${assignmentData.pickupStop.toUpperCase()}</div>
                </div>
                <div style="text-align: left; margin-left: 20px;">
                  <div style="color: black; font-size: 12px; margin-bottom: 3px;">TO</div>
                  <div style="font-weight: bold;">${assignmentData.dropoffStop.toUpperCase()}</div>
                </div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px; margin-right: 30px;">DROPOFF TIME</div>
                <div style="font-weight: bold;">${formattedTime}</div>
              </div>
              <div style="flex: 1; text-align: left;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px; margin-right: 30px;">VEHICLE</div>
                <div style="font-weight: bold;">A</div>
              </div>
              <div style="flex: 1; text-align: left;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">GATE</div>
                <div style="font-weight: bold;">A1</div>
              </div>
            </div>
            
            <div style="border-top: 2px dashed #ccc; padding-top: 15px; text-align: center;">
              ${discountHtml}
              
              <div style="margin-bottom: 10px;">
                <div style="color: black; font-size: 12px;">FARE</div>
                <div style="font-weight: bold; font-size: 20px; color: #0056b3;">₱${formattedAmount}</div>
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
    terminal1Logger.info(`Receipt email sent to ${email}`);
  } catch (error) {
    terminal1Logger.error(`Failed to send receipt email: ${error.message}`);
  }
}

export async function assignPickupOrDropoff(rfidOrNfc) {
  const timestamp = getFormattedGMT8();
  terminal1Logger.info(`Processing RFID/NFC: ${rfidOrNfc} at ${timestamp}`);

  try {
    const userId = await getUserIdFromRfidOrNfc(rfidOrNfc);
    if (!userId) {
      terminal1Logger.warn(`Unrecognized RFID/NFC: ${rfidOrNfc}`);
      return { status: "USER_NOT_FOUND" };
    }

    const userDoc = await db.collection("Users").doc(userId).get();
    if (!userDoc.exists) {
      terminal1Logger.warn(`Missing user document: ${userId}`);
      return { status: "USER_DOCUMENT_NOT_FOUND" };
    }

    const userData = userDoc.data();
    const userName =
      userData.name || `${userData.firstName} ${userData.lastName}`;

    const { hasLoan, loanedAmount } = await checkUserLoanStatus(userId);
    if (hasLoan) {
      terminal1Logger.warn(
        `User ${userId} has existing loan of ₱${loanedAmount}`
      );
      return {
        status: "LOAN_OUTSTANDING",
        message: "Please pay your existing loan first",
        loanedAmount,
      };
    }

    const currentTrainDoc = await db
      .collection("TrainSimulation")
      .doc("CurrentPosition")
      .get();

    if (!currentTrainDoc.exists || !currentTrainDoc.data().stopName) {
      terminal1Logger.error("Invalid train position data");
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
        terminal1Logger.warn(
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
          const {
            fare: totalAmount,
            originalFare,
            discountDetails,
          } = await calculateFare(activeTrip.pickupStop, stopName, userId);

          if (totalAmount <= 0) {
            terminal1Logger.error(`Invalid fare calculated for user ${userId}`);
            return {
              status: "INVALID_FARE",
              message: "Fare calculation failed",
            };
          }

          const paymentResult = await processPayment(userId, totalAmount);

          if (!paymentResult.success) {
            terminal1Logger.error(`Payment failed for user ${userId}`);
            return {
              status: "PAYMENT_FAILED",
              message: "Payment processing failed",
              error: paymentResult.error,
            };
          }

          const transactionResult = await recordTransaction(
            userId,
            userName,
            { ...activeTrip, ...assignmentData },
            currentVehicle,
            paymentResult,
            originalFare,
            discountDetails
          );

          if (!transactionResult.success) {
            terminal1Logger.error(
              `Transaction recording failed for user ${userId}: ${transactionResult.error}`
            );
            return {
              status: "TRANSACTION_FAILED",
              message: "Failed to record transaction",
              error: transactionResult.error,
            };
          }

          const {
            transactionId,
            totalAmount: actualAmount,
            originalFare: actualOriginalFare,
            discountDetails: actualDiscountDetails,
          } = transactionResult;

          await sendDropoffReceipt(
            userData.email,
            userName,
            { ...activeTrip, ...assignmentData },
            currentVehicle,
            transactionId,
            actualAmount,
            paymentResult,
            actualOriginalFare,
            actualDiscountDetails
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
        terminal1Logger.warn(
          `User ${userName} needs completed A trip before B`
        );
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
    terminal1Logger.error(`Processing error: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}