import db from "../database.js";
import { scanningLogger } from "../Services/logger.js";

export async function assignPickupOrDropoff(rfid) {
  try {
    scanningLogger.info(`Assigning action for RFID: ${rfid}`);

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
    const userRfidData = userRfidDoc.data();

    const userIdRef = userRfidData.userId;
    let userData = null;

    if (userIdRef) {
      const userDoc = await userIdRef.get();
      if (userDoc.exists) {
        userData = userDoc.data();
        scanningLogger.info(`User found: ${userIdRef.id}`);
      } else {
        scanningLogger.warn(
          `Linked user document not found for reference: ${userIdRef.id}`
        );
        return { status: "USER_DOCUMENT_NOT_FOUND" };
      }
    } else {
      scanningLogger.warn(
        `userId reference missing for RFID document: ${userRfidDoc.id}`
      );
      return { status: "USER_REFERENCE_MISSING" };
    }

    const walletQuery = await db
      .collection("UserWallet")
      .where("userId", "==", userIdRef)
      .limit(1)
      .get();

    const walletData = walletQuery.empty ? null : walletQuery.docs[0].data();
    scanningLogger.info(
      `Wallet ${walletQuery.empty ? "not found" : "found"} for user ${
        userIdRef.id
      }`
    );

    const currentTrainDoc = await db
      .collection("TrainSimulation")
      .doc("CurrentPosition")
      .get();

    if (!currentTrainDoc.exists) {
      scanningLogger.error("🚨 Train current position not found!");
      return { status: "TRAIN_POSITION_UNKNOWN" };
    }

    const trainPosition = currentTrainDoc.data();
    const currentStop = trainPosition.stopName || "Unknown Stop";

    const assignmentsCollection = db.collection("UserAssignments");

    const incompleteAssignmentQuery = await assignmentsCollection
      .where("userId", "==", userIdRef)
      .where("status", "in", ["pending", "pickup-completed"])
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let action = "";
    let assignmentData = {
      userId: userIdRef,
      updatedAt: new Date().toISOString(),
    };

    if (incompleteAssignmentQuery.empty) {
      assignmentData = {
        ...assignmentData,
        pickupStop: currentStop,
        pickupTime: new Date().toISOString(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      action = `📌 Assigned PICKUP at ${currentStop}`;

      await assignmentsCollection.add(assignmentData);
    } else {
      const existingAssignment = incompleteAssignmentQuery.docs[0];
      const existingData = existingAssignment.data();

      if (!existingData.pickupStop) {
        await existingAssignment.ref.update({
          pickupStop: currentStop,
          pickupTime: new Date().toISOString(),
          status: "pending",
          ...assignmentData,
        });
        action = `📌 Assigned PICKUP at ${currentStop}`;
      } else if (!existingData.dropoffStop) {
        // Add dropoff to existing assignment
        await existingAssignment.ref.update({
          dropoffStop: currentStop,
          dropoffTime: new Date().toISOString(),
          status: "completed",
          ...assignmentData,
        });
        action = `✅ Assigned DROPOFF at ${currentStop}`;
      } else {
        assignmentData = {
          ...assignmentData,
          pickupStop: currentStop,
          pickupTime: new Date().toISOString(),
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        action = `📌 Started new trip with PICKUP at ${currentStop}`;

        await assignmentsCollection.add(assignmentData);
      }
    }

    scanningLogger.info(`${action} [User: ${userData.name || userIdRef.id}]`);

    return {
      status: "ASSIGNED",
      user: {
        ...userData,
        documentId: userIdRef.id,
      },
      walletData,
      action,
      currentStop,
    };
  } catch (error) {
    scanningLogger.error(
      `❌ Error assigning pickup/dropoff: ${error.message}`,
      { stack: error.stack }
    );
    throw error;
  }
}
