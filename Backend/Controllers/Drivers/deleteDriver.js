import admin from "firebase-admin";

export async function handleDeleteDriver(ws, message) {
  try {
    const cleanedMessage = message.replace("[Delete_Driver] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;

    if (!userId) {
      ws.send("[Delete_Driver_Response] Error: User ID is required");
      return;
    }

    console.log("Delete driver request received for userId:", userId);

    const firestore = admin.firestore();
    const docRef = firestore.collection("Drivers").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.log(`Driver with userId ${userId} not found in Firestore`);
      ws.send(
        `[Delete_Driver_Response] Error: Driver with userId ${userId} not found`
      );
      return;
    }

    try {
      await admin.auth().deleteUser(userId);
      console.log(`Auth: Deleted user ${userId}`);
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Delete_Driver_Response] Error: ${authError.message}`);
    }

    try {
      await docRef.delete();
      console.log(`Firestore: Deleted document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Delete_Driver_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Delete_Driver_Response] Success: Driver ${userId} deleted`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Delete_Driver_Response] Error: ${error.message}`);
  }
}
