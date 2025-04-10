import db from "../database.js";

export async function createModelPassengerIfNotExist() {
  const ref = db.ref("passenger");
  const snapshot = await ref.once("value");

  if (!snapshot.exists()) {
    const defaultData = { description: "-" };

    await ref.set(defaultData);
    console.log("Passenger model created in Firebase Realtime Database.");
  } else {
    console.log("Passenger model already exists.");
  }
}
