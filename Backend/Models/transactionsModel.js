import db from "../database.js";

export async function createTransactionModelIfNotExist() {
  const ref = db.ref("Transactions");
  const snapshot = await ref.once("value");

  if (!snapshot.exists()) {
    const defaultData = {};

    await ref.set(defaultData);
    console.log("Transactions model created in Firebase Realtime Database.");
  } else {
    console.log("Transactions model already exists.");
  }
}
