import db from "../database.js";
import { scanningLogger } from "../Services/logger.js";

function getFormattedPST() {
  const now = new Date();
  const pstOffset = 8 * 60 * 60 * 1000; 
  const pstTime = new Date(now.getTime() + pstOffset);

  const month = pstTime.getMonth() + 1;
  const day = pstTime.getDate();
  const year = pstTime.getFullYear();

  let hours = pstTime.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  const minutes = pstTime.getMinutes().toString().padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

export async function assignPickupOrDropoff(rfid) {
  try {
    const timestamp = getFormattedPST();
    scanningLogger.info(`Assigning action for RFID: ${rfid} at ${timestamp}`);

    const userQuery = await db
      .collection("UserRFID")
      .where("rfid", "==", rfid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      scanningLogger.warn(`RFID not recognized: ${rfid}`);
      return { status: "USER_NOT_FOUND" };
    }

    const userRfidDoc = userQuery.docs[0];
    const userId = userRfidDoc.id;

    const userDoc = await db.collection("Users").doc(userId).get();
    if (!userDoc.exists) {
      scanningLogger.warn(`User document not found for ID: ${userId}`);
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
      scanningLogger.error("Train current position not found or invalid");
      return { status: "TRAIN_POSITION_INVALID" };
    }

    const stopName = currentTrainDoc.data().stopName;

    const userAssignmentRef = db.collection("UserAssignments").doc(userId);
    const assignmentDoc = await userAssignmentRef.get();

    let action = "";
    let updateData = {
      updatedAt: timestamp,
      userId: userId,
      userName: userName,
    };

    if (!assignmentDoc.exists) {
      updateData = {
        ...updateData,
        pickupStop: stopName,
        pickupTime: timestamp,
        dropoffStop: null,
        dropoffTime: null,
        status: "awaiting_dropoff",
        createdAt: timestamp,
      };
      action = `Assigned PICKUP at ${stopName} (${timestamp})`;
      await userAssignmentRef.set(updateData);
    } else {
      const existingData = assignmentDoc.data();

      if (!existingData.pickupStop) {
        updateData = {
          ...updateData,
          pickupStop: stopName,
          pickupTime: timestamp,
          status: "awaiting_dropoff",
        };
        action = `Assigned PICKUP at ${stopName} (${timestamp})`;
      } else if (
        !existingData.dropoffStop &&
        existingData.status === "awaiting_dropoff"
      ) {
        if (existingData.pickupStop === stopName) {
          action = `User already picked up at ${stopName} (${timestamp})`;
          updateData.status = "awaiting_dropoff";
        } else {
          updateData = {
            ...updateData,
            dropoffStop: stopName,
            dropoffTime: timestamp,
            status: "completed",
            completedAt: timestamp,
          };
          action = `Assigned DROPOFF at ${stopName} (${timestamp})`;
        }
      } else {
        updateData = {
          ...updateData,
          pickupStop: stopName,
          pickupTime: timestamp,
          dropoffStop: null,
          dropoffTime: null,
          status: "awaiting_dropoff",
          completedAt: null,
        };
        action = `Started new trip with PICKUP at ${stopName} (${timestamp})`;
      }

      await userAssignmentRef.update(updateData);
    }

    scanningLogger.info(`${action} [User: ${userName}]`);
    return {
      status: "ASSIGNED",
      action,
      timestamp: timestamp,
      assignmentData: updateData,
      user: {
        ...userData,
        documentId: userId,
      },
    };
  } catch (error) {
    scanningLogger.error(`Error in assignPickupOrDropoff: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}
