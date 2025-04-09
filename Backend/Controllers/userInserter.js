import db from "../database.js";

export async function insertUserData(userId, userData) {
  const ref = db.ref(`userAccounts/${userId}`);
  const snapshot = await ref.once("value");

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
