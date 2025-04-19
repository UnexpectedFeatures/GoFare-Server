export async function handleUpdateAdmin(ws, message) {
  try {
    const cleanedMessage = message.replace("[Update_Admin] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.id;
    const updatedData = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      middleName: parsed.middleName,
      email: parsed.email
    };

    if (!userId) {
      ws.send("[Update_Admin_Response] Error: Admin ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("Admins").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      ws.send(`[Update_Admin_Response] Error: Admin with id ${userId} not found`);
      return;
    }

    // Update Firebase Auth
    const authUserData = {
      ...(parsed.email && { email: parsed.email }),
      ...(parsed.firstName && { displayName: parsed.firstName }),
      ...(parsed.password && { password: parsed.password })
    };

    if (Object.keys(authUserData).length > 0) {
      try {
        await admin.auth().updateUser(userId, authUserData);
        console.log(`Auth: Updated user ${userId}`);
      } catch (authError) {
        console.error("Auth Error:", authError.message);
        ws.send(`[Update_Admin_Response] Error: ${authError.message}`);
        return;
      }
    }

    // Update Firestore
    try {
      await docRef.update(updatedData);
      console.log(`Firestore: Updated document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Update_Admin_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Update_Admin_Response] Success: Admin ${userId} updated`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Update_Admin_Response] Error: ${error.message}`);
  }
}
