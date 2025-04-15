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
    const userRfidDocId = userDoc.id;

    scanningLogger.info(`Found RFID document with ID: ${userRfidDocId}`);

    const userRef = db.collection("Users").doc(userRfidDocId);
    const userDocSnapshot = await userRef.get();

    let linkedUserData = null;
    if (userDocSnapshot.exists) {
      linkedUserData = userDocSnapshot.data();
      scanningLogger.info(`Linked User document found: ${userRfidDocId}`);
    } else {
      scanningLogger.warn(
        `Linked User document not found for ID: ${userRfidDocId}`
      );
    }

    let walletData = null;
    const walletRef = db.collection("UserWallet").doc(rfid);
    const walletDoc = await walletRef.get();

    if (walletDoc.exists) {
      walletData = walletDoc.data();
      scanningLogger.info(`Wallet found for RFID: ${rfid}`);
    } else {
      scanningLogger.warn(`Wallet not found for RFID: ${rfid}`);
    }

    const result = await assignPickupOrDropoff(rfid);
    scanningLogger.info(`Assignment status: ${result.status}`);

    return {
      userData: {
        ...userData,
        documentId: userRfidDocId,
      },
      linkedUserData: linkedUserData
        ? { ...linkedUserData, documentId: userRfidDocId }
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
