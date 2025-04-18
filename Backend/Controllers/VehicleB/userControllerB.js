import db from "../../database.js";
import { assignPickupOrDropoff } from "./userAssignmentB.js";
import { scanningLogger } from "../../Services/logger.js";

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

export async function findUserByRfidOrNfc(rfidOrNfc) {
  try {
    scanningLogger.info(`RFID/NFC scanned: ${rfidOrNfc}`);

    const userId = await getUserIdFromRfidOrNfc(rfidOrNfc);

    if (!userId) {
      scanningLogger.warn(`No user found with RFID/NFC: ${rfidOrNfc}`);
      return null;
    }

    const userRfidDoc = await db.collection("UserRFID").doc(userId).get();
    const userData = userRfidDoc.data();
    const searchType = userData.rfid === rfidOrNfc ? "RFID" : "NFC";

    scanningLogger.info(`Found ${searchType} document with ID: ${userId}`);

    const userDocSnapshot = await db.collection("Users").doc(userId).get();

    let linkedUserData = null;
    if (userDocSnapshot.exists) {
      linkedUserData = userDocSnapshot.data();
      scanningLogger.info(`Linked User document found: ${userId}`);
    } else {
      scanningLogger.warn(`Linked User document not found for ID: ${userId}`);
    }

    let walletData = null;
    const walletRef = db.collection("UserWallet").doc(userId);
    const walletDoc = await walletRef.get();

    if (walletDoc.exists) {
      walletData = walletDoc.data();
      scanningLogger.info(`Wallet found for user ID: ${userId}`);
    } else {
      scanningLogger.warn(`Wallet not found for user ID: ${userId}`);
    }

    const result = await assignPickupOrDropoff(rfidOrNfc);
    scanningLogger.info(`Assignment status: ${result.status}`);

    return {
      userData: {
        ...userData,
        documentId: userId,
        searchedBy: searchType,
      },
      linkedUserData: linkedUserData
        ? { ...linkedUserData, documentId: userId }
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
