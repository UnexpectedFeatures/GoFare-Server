import admin from "firebase-admin";

export async function handleDeleteAdmin(ws, message) {
  try {
    const cleanedMessage = message.replace("[Delete_Admin] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;

    if (!userId) {
      ws.send("[Delete_Admin_Response] Error: User ID is required");
      return;
    }

    console.log("Delete admin request received for userId:", userId);

    const firestore = admin.firestore();
    const docRef = firestore.collection("Admins").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.log(`Admin with userId ${userId} not found in Firestore`);
      ws.send(
        `[Delete_Admin_Response] Error: Admin with userId ${userId} not found`
      );
      return;
    }

    try {
      await admin.auth().deleteUser(userId);
      console.log(`Auth: Deleted user ${userId}`);
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Delete_Admin_Response] Error: ${authError.message}`);
    }

    try {
      await docRef.delete();
      console.log(`Firestore: Deleted document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Delete_Admin_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Delete_Admin_Response] Success: Admin ${userId} deleted`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Delete_Admin_Response] Error: ${error.message}`);
  }
}
