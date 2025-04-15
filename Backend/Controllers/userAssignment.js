import db from "../database.js";
import { scanningLogger } from "../Services/logger.js";

export async function assignPickupOrDropoff(rfid) {
  try {
    const userQuery = await db
      .collection("Users")
      .where("rfid", "==", rfid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      logger.warn(`RFID not recognized: ${rfid}`);
      return { status: "USER_NOT_FOUND" };
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    const walletQuery = await db
      .collection("UserWallet")
      .where("userId", "==", userDoc.ref)
      .limit(1)
      .get();

    const walletData = walletQuery.empty ? null : walletQuery.docs[0].data();

    const currentTrainDoc = await db
      .collection("TrainSimulation")
      .doc("CurrentPosition")
      .get();

    if (!currentTrainDoc.exists) {
      logger.error("🚨 Train current position not found!");
      return { status: "TRAIN_POSITION_UNKNOWN" };
    }

    const trainPosition = currentTrainDoc.data();
    const currentStop = trainPosition.stopName || "Unknown Stop";

    const userAssignmentRef = db.collection("UserAssignments").doc(userDoc.id);
    const existingAssignment = await userAssignmentRef.get();

    let action = "";
    if (!existingAssignment.exists || !existingAssignment.data().pickup) {
      // Assign pickup if it's the first scan or pickup not set
      await userAssignmentRef.set(
        {
          pickup: currentStop,
          assignedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      action = `📌 Assigned PICKUP at ${currentStop}`;
    } else if (!existingAssignment.data().dropoff) {
      // Assign dropoff on second scan
      await userAssignmentRef.set(
        {
          dropoff: currentStop,
          completedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      action = `✅ Assigned DROPOFF at ${currentStop}`;
    } else {
      action = `✔️ User already has pickup and dropoff set.`;
    }

    scanningLogger.info(`${action} [User: ${userData.name || userDoc.id}]`);

    return {
      status: "ASSIGNED",
      user: {
        ...userData,
        documentId: userDoc.id,
      },
      walletData,
      assignment: {
        ...(existingAssignment.exists ? existingAssignment.data() : {}),
        currentAction: action,
      },
    };
  } catch (error) {
    logger.error(`❌ Error assigning pickup/dropoff: ${error.message}`);
    throw error;
  }
}
