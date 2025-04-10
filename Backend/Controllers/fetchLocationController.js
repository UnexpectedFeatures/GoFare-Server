import db from "../database.js";

export default async function fetchLocation() {
  try {
    const snapshot = await db
      .ref("trainSimulation/currentPosition")
      .once("value");

    if (!snapshot.exists()) {
      console.log("No location data available");
      return null;
    }

    const locationData = snapshot.val();
    console.log("Fetched location data:", locationData);
    return locationData;
  } catch (error) {
    console.error("Error fetching location:", error);
    throw error;
  }
}
