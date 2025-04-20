import admin from "firebase-admin";

export async function handleDeactivateNFC(ws, message) {
  try {
    const cleanedMessage = message.replace("[Deactivate_NFC] ", "");
    const userId = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Deactivate_NFC_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("UserRFID").doc(userId);

    try {
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        ws.send(
          `[Deactivate_NFC_Response] Error: NFC user with ID ${userId} not found`
        );
        return;
      }

      await docRef.update({
        nfcActive: false,
      });

      console.log(`Successfully deactivated NFC for user ${userId}`);
      ws.send(
        `[Deactivate_NFC_Response] Success: NFC user ${userId} deactivated`
      );
    } catch (error) {
      console.error("Error:", error.message);
      ws.send(`[Deactivate_NFC_Response] Error: ${error.message}`);
    }
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Deactivate_NFC_Response] Error: ${error.message}`);
  }
}
