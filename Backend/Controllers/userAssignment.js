import db from "../database.js";
import { scanningLogger } from "../Services/logger.js";
import { allClients, broadcastToAll } from "../Websockets/serverSocket1.js";

function getFormattedGMT8() {
  const options = {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const gmt8Time = new Intl.DateTimeFormat("en-US", options).format(new Date());
  return gmt8Time.replace(",", "");
}

async function getUserIdFromRfidOrNfc(rfidOrNfc) {
  let userQuery = await db
    .collection("UserRFID")
    .where("rfid", "==", rfidOrNfc)
    .limit(1)
    .get();

  if (!userQuery.empty) {
    return userQuery.docs[0].id;
  }

  userQuery = await db
    .collection("UserRFID")
    .where("nfc", "==", rfidOrNfc)
    .limit(1)
    .get();

  if (!userQuery.empty) {
    return userQuery.docs[0].id;
  }

  return null;
}

export async function assignPickupOrDropoff(rfidOrNfc) {
  try {
    const timestamp = getFormattedGMT8();
    scanningLogger.info(
      `Assigning action for RFID/NFC: ${rfidOrNfc} at ${timestamp}`
    );

    const userId = await getUserIdFromRfidOrNfc(rfidOrNfc);

    if (!userId) {
      scanningLogger.warn(`RFID/NFC not recognized: ${rfidOrNfc}`);
      return { status: "USER_NOT_FOUND" };
    }

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

    const assignmentsCollection = db.collection("UserAssignments");
    const activeAssignmentQuery = await assignmentsCollection
      .where("userId", "==", userId)
      .where("status", "in", ["awaiting_dropoff", "in_progress"])
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let action = "";
    let assignmentRef;
    let assignmentData = {
      userId: userId,
      userName: userName,
      updatedAt: timestamp,
    };

    if (activeAssignmentQuery.empty) {
      assignmentRef = assignmentsCollection.doc();
      assignmentData = {
        ...assignmentData,
        pickupStop: stopName,
        pickupTime: timestamp,
        dropoffStop: null,
        dropoffTime: null,
        status: "awaiting_dropoff",
        createdAt: timestamp,
      };
      action = `PICKUP`;
      await assignmentRef.set(assignmentData);
    } else {
      assignmentRef = assignmentsCollection.doc(
        activeAssignmentQuery.docs[0].id
      );
      const existingData = activeAssignmentQuery.docs[0].data();

      if (!existingData.dropoffStop) {
        if (existingData.pickupStop === stopName) {
          assignmentData.status = "in_progress";
          action = `PICKUP_CONFIRMED`;
        } else {
          assignmentData = {
            ...assignmentData,
            dropoffStop: stopName,
            dropoffTime: timestamp,
            status: "completed",
            completedAt: timestamp,
          };
          action = `DROPOFF`;
        }
        await assignmentRef.update(assignmentData);
      } else {
        assignmentRef = assignmentsCollection.doc();
        assignmentData = {
          ...assignmentData,
          pickupStop: stopName,
          pickupTime: timestamp,
          dropoffStop: null,
          dropoffTime: null,
          status: "awaiting_dropoff",
          createdAt: timestamp,
          previousTripId: activeAssignmentQuery.docs[0].id,
        };
        action = `PICKUP`;
        await assignmentRef.set(assignmentData);
      }
    }

    scanningLogger.info(`${action} [User: ${userName}] at ${timestamp}`);

    const wsMessage = {
      type: "TRIP_UPDATE",
      data: {
        rfidOrNfc: rfidOrNfc,
        userId: userId,
        userName: userName,
        action: action,
        timestamp: timestamp,
        stopName: stopName,
        status: assignmentData.status,
        pickupStop: assignmentData.pickupStop,
        pickupTime: assignmentData.pickupTime,
        dropoffStop: assignmentData.dropoffStop,
        dropoffTime: assignmentData.dropoffTime,
        assignmentId: assignmentRef.id,
      },
    };

    broadcastToAll(null, JSON.stringify(wsMessage), allClients);

    return {
      status: "ASSIGNED",
      action,
      timestamp: timestamp,
      assignmentData: assignmentData,
      assignmentId: assignmentRef.id,
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
