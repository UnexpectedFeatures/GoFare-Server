import db from "../database.js";

export async function createModelAdminIfNotExist() {
  const ref = db.ref("adminAccounts");
  const snapshot = await ref.once("value");

  if (!snapshot.exists()) {
    const defaultData = {};

    await ref.set(defaultData);
    console.log("Admin model created in Firebase Realtime Database.");
  } else {
    console.log("Admin model already exists.");
  }
}
