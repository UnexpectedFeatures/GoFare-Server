import admin from "firebase-admin";

export async function handleDeactivateRFID(ws, message) {
  try {
    const cleanedMessage = message.replace("[Deactivate_RFID] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;

    if (!userId) {
      ws.send("[Deactivate_RFID_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("UserRFID").doc(userId);

    try {
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        ws.send(
          `[Deactivate_RFID_Response] Error: RFID user with ID ${userId} not found`
        );
        return;
      }

      await docRef.update({
        rfidActive: false,
      });

      console.log(`Successfully deactivated RFID for user ${userId}`);
      ws.send(
        `[Deactivate_RFID_Response] Success: RFID user ${userId} deactivated`
      );
    } catch (error) {
      console.error("Error:", error.message);
      ws.send(`[Deactivate_RFID_Response] Error: ${error.message}`);
    }
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Deactivate_RFID_Response] Error: ${error.message}`);
  }
}
