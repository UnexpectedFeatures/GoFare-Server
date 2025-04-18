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
    const currentVehicle = currentTrainDoc.data().vehicle || "a";

    const assignmentsCollection = db.collection("UserAssignments");

    const activeTripsQuery = await assignmentsCollection
      .where("userId", "==", userId)
      .where("status", "in", ["awaiting_dropoff", "in_progress"])
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let action = "";
    let assignmentRef = null;
    let assignmentData = {};

    if (!activeTripsQuery.empty) {
      const activeTrip = activeTripsQuery.docs[0].data();
      assignmentRef = assignmentsCollection.doc(activeTripsQuery.docs[0].id);

      if (activeTrip.vehicle !== currentVehicle) {
        scanningLogger.warn(
          `User ${userName} attempted to board vehicle ${currentVehicle} while having active trip on vehicle ${activeTrip.vehicle}`
        );
        return {
          status: "ACTIVE_TRIP_ON_ANOTHER_VEHICLE",
          currentVehicle: currentVehicle,
          activeTripVehicle: activeTrip.vehicle,
          message: "Cannot board another vehicle while having an active trip",
        };
      }

      if (!activeTrip.dropoffStop) {
        if (activeTrip.pickupStop === stopName) {
          assignmentData = {
            status: "in_progress",
            updatedAt: timestamp,
          };
          action =
            currentVehicle === "a"
              ? `PICKUP_A_CONFIRMED`
              : `PICKUP_B_CONFIRMED`;
          await assignmentRef.update(assignmentData);
        } else {
          assignmentData = {
            dropoffStop: stopName,
            dropoffTime: timestamp,
            status: "completed",
            completedAt: timestamp,
            updatedAt: timestamp,
          };
          action = currentVehicle === "a" ? `DROPOFF_A` : `DROPOFF_B`;
          await assignmentRef.update(assignmentData);
        }

        const updatedAssignment = {
          ...activeTrip,
          ...assignmentData,
        };

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
          timestamp: timestamp,
          assignmentData: updatedAssignment,
          assignmentId: assignmentRef.id,
          user: {
            ...userData,
            documentId: userId,
          },
          vehicle: currentVehicle,
        };
      }
    }

    if (currentVehicle === "a") {
      assignmentRef = assignmentsCollection.doc();
      assignmentData = {
        userId: userId,
        userName: userName,
        vehicle: currentVehicle,
        pickupStop: stopName,
        pickupTime: timestamp,
        dropoffStop: null,
        dropoffTime: null,
        status: "awaiting_dropoff",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      action = `PICKUP_A`;
      await assignmentRef.set(assignmentData);
    } else if (currentVehicle === "b") {
      const completedATripQuery = await assignmentsCollection
        .where("userId", "==", userId)
        .where("vehicle", "==", "a")
        .where("status", "==", "completed")
        .limit(1)
        .get();

      if (completedATripQuery.empty) {
        scanningLogger.warn(
          `User must complete a trip on vehicle A before using vehicle B`
        );
        return { status: "VEHICLE_A_REQUIRED_FIRST" };
      }

      assignmentRef = assignmentsCollection.doc();
      assignmentData = {
        userId: userId,
        userName: userName,
        vehicle: currentVehicle,
        pickupStop: stopName,
        pickupTime: timestamp,
        dropoffStop: null,
        dropoffTime: null,
        status: "awaiting_dropoff",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      action = `PICKUP_B`;
      await assignmentRef.set(assignmentData);
    } else {
      scanningLogger.warn(`Invalid vehicle type: ${currentVehicle}`);
      return { status: "INVALID_VEHICLE_TYPE" };
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
        vehicle: currentVehicle,
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
      vehicle: currentVehicle,
    };
  } catch (error) {
    scanningLogger.error(`Error in assignPickupOrDropoff: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}
