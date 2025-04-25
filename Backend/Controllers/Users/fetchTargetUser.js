import db from "../../database.js";

export const handleFetchTargetUser = async (ws, message) => {
  try {
    const payload = JSON.parse(message.replace("[Fetch_Target_User]", "").trim());
    const userId = payload.userId;

    console.log("Fetching User with userId:", userId);

    const docRef = db.collection("Users").doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      ws.send(`[User_Fetch_Response] null`);
      return;
    }

    // Destructure and exclude 'enabled' field
    const { enabled, ...rest } = docSnap.data();

    const adminData = {
      userId: docSnap.id,
      ...rest, // Only remaining fields, without 'enabled'
    };

    console.log("Fetched admin (excluding enabled):", adminData);

    ws.send(`[User_Fetch_Response] ${JSON.stringify(adminData)}`);
  } catch (error) {
    console.error("Error fetching user:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch user",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
