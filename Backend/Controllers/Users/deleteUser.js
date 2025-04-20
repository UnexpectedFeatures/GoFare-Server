import admin from "firebase-admin";

export async function handleDeleteUser(ws, message) {
  try {
    const cleanedMessage = message.replace("[Delete_User] ", "");
    const parsed = JSON.parse(cleanedMessage);
    console.log("Parsed message:", parsed); 
    const userId = parsed.userId;

    if (!userId) {
      ws.send("[Delete_User_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();
    const userDocRef = firestore.collection("Users").doc(userId);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
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
      const batch = firestore.batch();

      batch.delete(userDocRef);

      const userRfidRef = firestore.collection("UserRFID").doc(userId);
      batch.delete(userRfidRef);

      const userPinRef = firestore.collection("UserPin").doc(userId);
      batch.delete(userPinRef);

      const userWalletRef = firestore.collection("UserWallet").doc(userId);
      batch.delete(userWalletRef);

      await batch.commit();

      console.log(
        `Firestore: Deleted documents for user ${userId} and all related collections (Users, UserRFID, UserPin, UserWallet)`
      );
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);

      ws.send(`[Delete_User_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(
      `[Delete_User_Response] Success: User ${userId} and all related data (including wallet) deleted`
    );
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Delete_User_Response] Error: ${error.message}`);
  }
}
