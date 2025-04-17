import db from "../database.js";
import { assignPickupOrDropoff } from "./userAssignment.js";
import { scanningLogger } from "../Services/logger.js";

export async function findUserByRfidOrNfc(rfidOrNfc) {
  try {
    scanningLogger.info(`RFID/NFC scanned: ${rfidOrNfc}`);

    let userQuery = await db
      .collection("UserRFID")
      .where("rfid", "==", rfidOrNfc)
      .limit(1)
      .get();

    let searchType = "RFID";

    if (userQuery.empty) {
      scanningLogger.warn(`No user found with RFID: ${rfidOrNfc}`);
      scanningLogger.info(`Attempting to search by NFC instead.`);

      userQuery = await db
        .collection("UserRFID")
        .where("nfc", "==", rfidOrNfc)
        .limit(1)
        .get();

      searchType = "NFC";

      if (userQuery.empty) {
        scanningLogger.warn(`No user found with NFC: ${rfidOrNfc}`);
        return null;
      }
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userRfidDocId = userDoc.id;

    scanningLogger.info(
      `Found ${searchType} document with ID: ${userRfidDocId}`
    );

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
    const walletRef = db.collection("UserWallet").doc(rfidOrNfc);
    const walletDoc = await walletRef.get();

    if (walletDoc.exists) {
      walletData = walletDoc.data();
      scanningLogger.info(`Wallet found for ${searchType}: ${rfidOrNfc}`);
    } else {
      scanningLogger.warn(`Wallet not found for ${searchType}: ${rfidOrNfc}`);
    }

    const result = await assignPickupOrDropoff(rfidOrNfc);
    scanningLogger.info(`Assignment status: ${result.status}`);

    return {
      userData: {
        ...userData,
        documentId: userRfidDocId,
        searchedBy: searchType,
      },
      linkedUserData: linkedUserData
        ? { ...linkedUserData, documentId: userRfidDocId }
        : null,
      walletData: walletData,
      walletExists: walletData !== null,
      assignmentStatus: result.status,
    };
  } catch (error) {
    scanningLogger.error(`Error in findUserByRfidOrNfc: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}
