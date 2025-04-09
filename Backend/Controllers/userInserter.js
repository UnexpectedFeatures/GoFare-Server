import db from "../database.js";
import admin from "firebase-admin";

export async function insertUserData(userId, userData) {
  const ref = db.ref(`userAccounts/${userId}`);
  const snapshot = await ref.once("value");

  try {
    await admin.auth().createUser({
      uid: userId,
      email: userData.email,
      displayName: userData.firstName,
    });
    console.log(`User created in Authentication for ${userId}`);
  } catch (error) {
    if (error.code === "auth/uid-already-exists") {
      console.log(
        `User ${userId} already exists in Authentication, updating instead`
      );
      await admin.auth().updateUser(userId, {
        email: userData.email,
        displayName: userData.firstName,
      });
    } else {
      throw error;
    }
  }

  if (!snapshot.exists()) {
    console.log(
      `User account path 'userAccounts/${userId}' does not exist, creating user...`
    );
    await ref.set(userData);
    console.log(`User account created for ${userId}`);
  } else {
    await ref.update(userData);
    console.log(`User data inserted for ${userId}`);
  }
  return true;
}

export async function insertWalletData(userId, walletData) {
  const walletsRef = db.ref(`userAccounts/${userId}/wallets`);
  const snapshot = await walletsRef.once("value");

  if (!snapshot.exists()) {
    console.log(
      `Wallet path 'userAccounts/${userId}/wallets' does not exist, creating wallet...`
    );
    await walletsRef.set(walletData);
    console.log(`Wallet created for user ${userId}`);
  } else {
    await walletsRef.update(walletData);
    console.log(`Wallet data inserted for user ${userId}`);
  }
  return true;
}
