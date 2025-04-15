import db from "../database.js";
import { assignPickupOrDropoff } from "./userAssignment.js";

export async function findUserByRfid(rfid) {
  try {
    const userQuery = await db
      .collection("Users")
      .where("rfid", "==", rfid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      console.log(`No user found with RFID: ${rfid}`);
      return null;
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    const walletQuery = await db
      .collection("UserWallet")
      .where("userId", "==", userDoc.ref)
      .limit(1)
      .get();

    const result = await assignPickupOrDropoff(rfid);

    return {
      userData: {
        ...userData,
        documentId: userDoc.id,
      },
      walletData: walletQuery.empty ? null : walletQuery.docs[0].data(),
      walletExists: !walletQuery.empty,
      assignmentStatus: result.status,
    };
  } catch (error) {
    console.error(`Error in findUserByRfidWithWallet:`, error);
    throw error;
  }
}
