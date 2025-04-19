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

async function sendDropoffReceipt(email, userName, assignmentData, vehicle) {
  try {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: `Your ${vehicle.toUpperCase()} Journey Receipt`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #0056b3; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header with blue background -->
          <div style="background-color: #0056b3; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">${vehicle.toUpperCase()} JOURNEY RECEIPT</h1>
          </div>
          
          <!-- Main content -->
          <div style="padding: 20px;">
            <!-- Passenger and Ticket Info -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">PASSENGER</div>
                <div style="font-weight: bold; font-size: 18px;">${userName.toUpperCase()}</div>
              </div>
              <div style="text-align: right; margin-left: 225px;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">TICKET TYPE</div>
                <div style="font-weight: bold; font-size: 18px;">ONE WAY</div>
              </div>
            </div>
            
            <!-- Flight/Vehicle Info -->
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
            
            <!-- Time and Seat Info -->
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
            
            <!-- Price and Barcode -->
            <div style="border-top: 2px dashed #ccc; padding-top: 15px; text-align: center;">
              <div style="margin-bottom: 10px;">
                <div style="color: black; font-size: 12px;">FARE</div>
                <div style="font-weight: bold; font-size: 20px; color: #0056b3;">£0.00</div>
              </div>
              <div style="background-color: #f0f0f0; padding: 10px; display: inline-block; margin-bottom: 15px;">
                <div style="font-family: 'Courier New', monospace; letter-spacing: 3px; font-weight: bold;">93174040187371</div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
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

      if (!activeTrip.dropoffStop) {
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
            await sendDropoffReceipt(
              userData.email,
              userName,
              { ...activeTrip, ...assignmentData },
              currentVehicle
            );
          } else {
            scanningLogger.warn(
              `No email found for user ${userId}, cannot send receipt`
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
