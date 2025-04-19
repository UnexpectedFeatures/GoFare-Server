import db from "../../database.js";
import { assignPickupOrDropoff } from "./userAssignmentB.js";
import { allClients, broadcastToAll } from "../../Websockets/serverSocket1b.js";
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
      broadcastToAll(
        null,
        JSON.stringify({
          type: "SCAN_RESULT",
          status: "not_found",
          message: "No user found with this RFID/NFC",
          rfid: rfidOrNfc,
        }),
        allClients
      );
      return {
        error: "No user found with this RFID/NFC",
        status: "not_found",
      };
    }

    const userRfidDoc = await db.collection("UserRFID").doc(userId).get();
    const userData = userRfidDoc.data();

    if (userData.active === false) {
      scanningLogger.warn(`Card is deactivated for user ID: ${userId}`);
      const errorMessage = {
        type: "SCAN_RESULT",
        status: "card_deactivated",
        message: "Your card has been deactivated",
        userId: userId,
        rfid: rfidOrNfc,
      };
      broadcastToAll(null, JSON.stringify(errorMessage), allClients);
      return {
        error: "Your card has been deactivated",
        status: "card_deactivated",
      };
    }

    const searchType = userData.rfid === rfidOrNfc ? "RFID" : "NFC";
    scanningLogger.info(`Found ${searchType} document with ID: ${userId}`);

    let linkedUserData = null;
    const userDocSnapshot = await db.collection("Users").doc(userId).get();
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

      if (walletData.loaned === true) {
        scanningLogger.warn(`User has an active loan: ${userId}`);
        const errorMessage = {
          type: "SCAN_RESULT",
          status: "active_loan",
          message: "You have an active loan and cannot proceed",
          userId: userId,
          rfid: rfidOrNfc,
        };
        broadcastToAll(null, JSON.stringify(errorMessage), allClients);
        return {
          error: "You have an active loan and cannot proceed",
          status: "active_loan",
        };
      }
    } else {
      scanningLogger.warn(`Wallet not found for user ID: ${userId}`);
    }

    const result = await assignPickupOrDropoff(rfidOrNfc);
    scanningLogger.info(`Assignment status: ${result.status}`);

    const successMessage = {
      type: "SCAN_RESULT",
      status: "success",
      userId: userId,
      rfid: rfidOrNfc,
      assignmentStatus: result.status,
      userData: {
        ...userData,
        documentId: userId,
        searchedBy: searchType,
      },
    };
    broadcastToAll(null, JSON.stringify(successMessage), allClients);

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
    broadcastToAll(
      null,
      JSON.stringify({
        type: "SCAN_RESULT",
        status: "error",
        message: "Error processing RFID scan",
        error: error.message,
      }),
      allClients
    );
    throw error;
  }
}
