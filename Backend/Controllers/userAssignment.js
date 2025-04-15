import db from "../database.js";
import { scanningLogger } from "../Services/logger.js";

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

export async function assignPickupOrDropoff(rfid) {
  try {
    const timestamp = getFormattedGMT8();
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
      action = `New trip - PICKUP at ${stopName}`;
      await assignmentRef.set(assignmentData);
    } else {
      assignmentRef = assignmentsCollection.doc(
        activeAssignmentQuery.docs[0].id
      );
      const existingData = activeAssignmentQuery.docs[0].data();

      if (!existingData.dropoffStop) {
        if (existingData.pickupStop === stopName) {
          assignmentData.status = "in_progress";
          action = `Still at pickup location ${stopName}`;
        } else {
          assignmentData = {
            ...assignmentData,
            dropoffStop: stopName,
            dropoffTime: timestamp,
            status: "completed",
            completedAt: timestamp,
          };
          action = `DROPOFF at ${stopName}`;
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
        action = `New trip started - PICKUP at ${stopName}`;
        await assignmentRef.set(assignmentData);
      }
    }

    scanningLogger.info(`${action} [User: ${userName}] at ${timestamp}`);
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
