import admin from "firebase-admin";

export async function handleActivateNFC(ws, message) {
  try {
    const cleanedMessage = message.replace("[Activate_NFC] ", "");
    const userId = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Activate_NFC_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("UserRFID").doc(userId);

    try {
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        ws.send(
          `[Activate_NFC_Response] Error: NFC user with ID ${userId} not found`
        );
        return;
      }

      await docRef.update({
        nfcActive: true,
      });

      console.log(`Successfully activated NFC for user ${userId}`);
      ws.send(`[Activate_NFC_Response] Success: NFC user ${userId} activated`);
    } catch (error) {
      console.error("Error:", error.message);
      ws.send(`[Activate_NFC_Response] Error: ${error.message}`);
    }
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Activate_NFC_Response] Error: ${error.message}`);
  }
}
