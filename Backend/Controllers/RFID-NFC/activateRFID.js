import admin from "firebase-admin";

export async function handleActivateRFID(ws, message) {
  try {
    const cleanedMessage = message.replace("[Activate_RFID] ", "");
    const userId = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Activate_RFID_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("UserRFID").doc(userId);

    try {
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        ws.send(
          `[Activate_RFID_Response] Error: RFID user with ID ${userId} not found`
        );
        return;
      }

      await docRef.update({
        rfidActive: true,
      });

      console.log(`Successfully activated RFID for user ${userId}`);
      ws.send(
        `[Activate_RFID_Response] Success: RFID user ${userId} activated`
      );
    } catch (error) {
      console.error("Error:", error.message);
      ws.send(`[Activate_RFID_Response] Error: ${error.message}`);
    }
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Activate_RFID_Response] Error: ${error.message}`);
  }
}
