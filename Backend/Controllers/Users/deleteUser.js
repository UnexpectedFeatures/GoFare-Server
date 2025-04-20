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
    const userDocRef = firestore.collection("Users").doc(userId);
    const userArchiveDocRef = firestore.collection("UserArchive").doc(userId);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      ws.send(`[Delete_User_Response] Error: User with userId ${userId} not found`);
      return;
    }

    const userData = userDocSnapshot.data();
    userData.archivedAt = admin.firestore.FieldValue.serverTimestamp();
    await userArchiveDocRef.set(userData);

    try {
      await admin.auth().deleteUser(userId);
      console.log(`Auth: Deleted user ${userId}`);
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Delete_User_Response] Error: ${authError.message}`);
      return;
    }

    try {
      const batch = firestore.batch();

      batch.delete(userDocRef);
      batch.delete(firestore.collection("UserRFID").doc(userId));
      batch.delete(firestore.collection("UserPin").doc(userId));
      batch.delete(firestore.collection("UserWallet").doc(userId));

      await batch.commit();

      console.log(`Firestore: Deleted documents for user ${userId} and related collections`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Delete_User_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Delete_User_Response] Success: User ${userId} archived and deleted`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Delete_User_Response] Error: ${error.message}`);
  }
}
