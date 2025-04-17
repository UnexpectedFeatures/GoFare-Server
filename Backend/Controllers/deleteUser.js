import admin from "firebase-admin";

export async function handleDeleteUser(ws, message) {
  try {
    const cleanedMessage = message.replace("[Delete_User] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;

    if (!userId) {
      ws.send("[Delete_User_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("Users").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      ws.send(
        `[Delete_User_Response] Error: User with userId ${userId} not found`
      );
      return;
    }

    try {
      await admin.auth().deleteUser(userId);
      console.log(`Auth: Deleted user ${userId}`);
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Delete_User_Response] Error: ${authError.message}`);
      return;
    }

    try {
      await docRef.delete();
      console.log(`Firestore: Deleted document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Delete_User_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Delete_User_Response] Success: User ${userId} deleted`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Delete_User_Response] Error: ${error.message}`);
  }
}
