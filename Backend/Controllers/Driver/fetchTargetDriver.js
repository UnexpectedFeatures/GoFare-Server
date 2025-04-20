import db from "../../database.js";

export const handleFetchTargetDriver = async (ws, message) => {
  try {
    const payload = JSON.parse(message.replace("[Fetch_Target_Driver]", "").trim());
    const userId = payload.userId;

    console.log("Fetching Driver with userId:", userId);

    const docRef = db.collection("Drivers").doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      ws.send(`[Driver_Fetch_Response] null`);
      return;
    }

    // Destructure and exclude 'enabled' field
    const { enabled, ...rest } = docSnap.data();

    const driverData = {
      userId: docSnap.id,
      ...rest, // Only remaining fields, without 'enabled'
    };

    console.log("Fetched driver (excluding enabled):", driverData);

    ws.send(`[Driver_Fetch_Response] ${JSON.stringify(driverData)}`);
  } catch (error) {
    console.error("Error fetching driver:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch driver",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
