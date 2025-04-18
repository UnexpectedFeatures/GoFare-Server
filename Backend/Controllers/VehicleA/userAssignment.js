import db from "../../database.js";
import { scanningLogger } from "../../Services/logger.js";
import { allClients, broadcastToAll } from "../../Websockets/serverSocket1.js";

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
  return new Intl.DateTimeFormat("en-US", options)
    .format(new Date())
    .replace(",", "");
}

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
