import admin from "firebase-admin";

export async function handleUpdateUser(ws, message) {
  try {
    const cleanedMessage = message.replace("[Update_User] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;
    const updatedData = parsed.updatedData;

    if (!userId || !updatedData) {
      ws.send(
        "[Update_User_Response] Error: User ID and updated data are required"
      );
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("Users").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      ws.send(
        `[Update_User_Response] Error: User with userId ${userId} not found`
      );
      return;
    }

    try {
      const authUserData = {
        ...(updatedData.email && { email: updatedData.email }),
        ...(updatedData.firstName && { displayName: updatedData.firstName }),
        ...(updatedData.password && { password: updatedData.password }),
      };

      if (Object.keys(authUserData).length > 0) {
        await admin.auth().updateUser(userId, authUserData);
        console.log(`Auth: Updated user ${userId}`);
      }
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Update_User_Response] Error: ${authError.message}`);
      return;
    }

    try {
      updatedData.updatedDate = admin.firestore.FieldValue.serverTimestamp();

      await docRef.update(updatedData);
      console.log(`Firestore: Updated document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Update_User_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Update_User_Response] Success: User ${userId} updated`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Update_User_Response] Error: ${error.message}`);
  }
}
