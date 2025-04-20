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

    const adminData = docSnapshot.data();

    // Extract only required fields
    const archiveData = {
      email: adminData.email || "",
      firstName: adminData.firstName || "",
      middleName: adminData.middleName || "",
      lastName: adminData.lastName || "",
      password: adminData.password || "",
    };

    try {
      await firestore.collection("AdminArchive").doc(userId).set(archiveData);
      console.log(`Admin data archived to AdminArchive for ${userId}`);
    } catch (archiveError) {
      console.error("Archiving Error:", archiveError.message);
      ws.send(`[Delete_Admin_Response] Error archiving admin: ${archiveError.message}`);
      return;
    }

    try {
      await admin.auth().deleteUser(userId);
      console.log(`Auth: Deleted user ${userId}`);
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Delete_Admin_Response] Error deleting from Auth: ${authError.message}`);
      return;
    }

    try {
      await docRef.delete();
      console.log(`Firestore: Deleted document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Delete_Admin_Response] Error deleting from Firestore: ${dbError.message}`);
      return;
    }

    ws.send(`[Delete_Admin_Response] Success: Admin ${userId} archived and deleted`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Delete_Admin_Response] Error: ${error.message}`);
  }
}
