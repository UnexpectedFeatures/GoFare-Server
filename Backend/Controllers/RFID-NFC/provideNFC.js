import admin from "firebase-admin";

export async function handleProvideNFC(ws, message) {
  try {
    const cleanedMessage = message.replace("[Provide_NFC] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const { userId, NFC } = parsed;

    if (!userId) {
      ws.send("[Provide_NFC_Response] Error: User ID is required");
      return;
    }

    if (!NFC) {
      ws.send("[Provide_NFC_Response] Error: NFC value is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("UserRFID").doc(userId);

    try {
      await docRef.set(
        {
          nfc: NFC,
          nfcActive: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`NFC ${NFC} assigned to user ${userId} and activated`);
      ws.send(
        `[Provide_NFC_Response] Success: NFC assigned to user ${userId} and activated`
      );
    } catch (error) {
      console.error("Error updating NFC:", error.message);
      ws.send(`[Provide_NFC_Response] Error: ${error.message}`);
    }
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Provide_NFC_Response] Error: ${error.message}`);
  }
}
