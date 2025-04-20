import admin from "firebase-admin";

export async function handleToggleUserStatus(ws, message) {
  try {
    const cleanedMessage = message.replace("[Toggle_User_Status] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const { userId, status } = parsed;

    if (!userId || typeof status !== "boolean") {
      ws.send("[Toggle_User_Status_Response] Error: userId and boolean status are required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("Users").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      ws.send(`[Toggle_User_Status_Response] Error: User with userId ${userId} not found`);
      return;
    }

    await docRef.update({
      enabled: status,
      updateDate: admin.firestore.FieldValue.serverTimestamp(),
    });

    ws.send(`[Toggle_User_Status_Response] Success: User ${userId} status updated to ${status}`);
  } catch (error) {
    console.error("Toggle Status Error:", error.message);
    ws.send(`[Toggle_User_Status_Response] Error: ${error.message}`);
  }
}
