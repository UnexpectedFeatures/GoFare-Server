import admin from "firebase-admin";

export async function handleProvideRFID(ws, message) {
  try {
    const cleanedMessage = message.replace("[Provide_RFID] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const { userId, RFID } = parsed;

    if (!userId) {
      ws.send("[Provide_RFID_Response] Error: User ID is required");
      return;
    }

    if (!RFID) {
      ws.send("[Provide_RFID_Response] Error: RFID value is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("UserRFID").doc(userId);

    try {
      await docRef.set(
        {
          rfid: RFID,
          rfidActive: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`RFID ${RFID} assigned to user ${userId} and activated`);
      ws.send(
        `[Provide_RFID_Response] Success: RFID assigned to user ${userId} and activated`
      );
    } catch (error) {
      console.error("Error updating RFID:", error.message);
      ws.send(`[Provide_RFID_Response] Error: ${error.message}`);
    }
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Provide_RFID_Response] Error: ${error.message}`);
  }
}
