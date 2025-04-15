import db from "../database.js";
import { assignPickupOrDropoff } from "./userAssignment.js";
import { scanningLogger } from "../Services/logger.js";

export async function findUserByRfid(rfid) {
  try {
    scanningLogger.info(`RFID scanned: ${rfid}`);

    const userQuery = await db
      .collection("UserRFID")
      .where("rfid", "==", rfid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      scanningLogger.warn(`No user found with RFID: ${rfid}`);
      return null;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    const userIdRef = userData.userId;
    let linkedUserData = null;

    if (userIdRef) {
      const linkedUserDoc = await userIdRef.get();
      if (linkedUserDoc.exists) {
        linkedUserData = linkedUserDoc.data();
        scanningLogger.info(`Linked User document found: ${userIdRef.id}`);
      } else {
        scanningLogger.warn(
          `Linked User document not found for reference: ${userIdRef.id}`
        );
      }
    } else {
      scanningLogger.warn(
        `No userId reference found in RFID document: ${userDoc.id}`
      );
    }

    let walletData = null;
    if (userIdRef) {
      const walletQuery = await db
        .collection("UserWallet")
        .where("userId", "==", userIdRef)
        .limit(1)
        .get();

      walletData = walletQuery.empty ? null : walletQuery.docs[0].data();

      scanningLogger.info(
        `Wallet ${walletQuery.empty ? "not found" : "found"} for linked user ${
          userIdRef.id
        }`
      );
    }

    const result = await assignPickupOrDropoff(rfid);
    scanningLogger.info(`Assignment status: ${result.status}`);

    return {
      userData: {
        ...userData,
        documentId: userDoc.id,
      },
      linkedUserData: linkedUserData
        ? { ...linkedUserData, documentId: userIdRef.id }
        : null,
      walletData: walletData,
      walletExists: walletData !== null,
      assignmentStatus: result.status,
    };
  } catch (error) {
    scanningLogger.error(`Error in findUserByRfid: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}
