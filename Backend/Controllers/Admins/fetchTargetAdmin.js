import db from "../../database.js";

export const handleFetchTargetAdmin = async (ws, message) => {
  try {
    const payload = JSON.parse(message.replace("[Fetch_Target_Admin]", "").trim());
    const userId = payload.userId;

    console.log("Fetching Admin with userId:", userId);

    const docRef = db.collection("Admins").doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      ws.send(`[Admin_Fetch_Response] null`);
      return;
    }

    // Destructure and exclude 'enabled' field
    const { enabled, ...rest } = docSnap.data();

    const adminData = {
      userId: docSnap.id,
      ...rest, // Only remaining fields, without 'enabled'
    };

    console.log("Fetched admin (excluding enabled):", adminData);

    ws.send(`[Admin_Fetch_Response] ${JSON.stringify(adminData)}`);
  } catch (error) {
    console.error("Error fetching admin:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch admin",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
