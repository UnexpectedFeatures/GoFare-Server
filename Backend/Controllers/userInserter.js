import db from "../database.js";
import admin from "firebase-admin";

export async function insertUserData(userId, userData) {
  if (!userId || !userData.email) {
    throw new Error("User ID and email are required");
  }

  const authUserData = {
    uid: userId,
    email: userData.email,
    emailVerified: false,
    disabled: false,
    ...(userData.firstName && { displayName: userData.firstName }),
    ...(userData.password && { password: userData.password }),
    ...(userData.phoneNumber && { phoneNumber: userData.phoneNumber }),
    ...(userData.photoURL && { photoURL: userData.photoURL }),
  };

  const dbUserData = {
    firstName: userData.firstName,
    email: userData.email,
    rfid: userData.rfid || null,
    ...(userData.phoneNumber && { phoneNumber: userData.phoneNumber }),
    ...(userData.photoURL && { photoURL: userData.photoURL }),
  };

  try {
    const ref = db.ref(`ClientReference/${userId}`);
    const snapshot = await ref.once("value");

    try {
      if (!snapshot.exists()) {
        await admin.auth().createUser(authUserData);
        console.log(`Successfully created auth user: ${userId}`);
      } else {
        await admin.auth().updateUser(userId, authUserData);
        console.log(`Successfully updated auth user: ${userId}`);
      }
    } catch (authError) {
      console.error("Firebase Auth error:", authError.message);
      throw new Error(`Authentication operation failed: ${authError.message}`);
    }

    try {
      if (!snapshot.exists()) {
        await ref.set(dbUserData);
        console.log(`Successfully created database record for: ${userId}`);
      } else {
        await ref.update(dbUserData);
        console.log(`Successfully updated database record for: ${userId}`);
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError.message);
      if (!snapshot.exists()) {
        try {
          await admin.auth().deleteUser(userId);
          console.log(
            `Rollback: Deleted auth user ${userId} due to database failure`
          );
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError.message);
        }
      }
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

    return {
      success: true,
      userId: userId,
      authData: authUserData,
      dbData: dbUserData,
    };
  } catch (error) {
    console.error("Failed to insert user data:", error.message);
    throw error;
  }
}

export async function insertWalletData(userId, walletData) {
  const walletsRef = db.ref(`ClientReference/${userId}/wallets`);
  const snapshot = await walletsRef.once("value");

  if (!snapshot.exists()) {
    console.log(
      `Wallet path 'ClientReference/${userId}/wallets' does not exist, creating wallet...`
    );
    await walletsRef.set(walletData);
    console.log(`Wallet created for user ${userId}`);
  } else {
    await walletsRef.update(walletData);
    console.log(`Wallet data inserted for user ${userId}`);
  }
  return true;
}
