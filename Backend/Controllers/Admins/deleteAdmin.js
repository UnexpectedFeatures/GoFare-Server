import admin from "firebase-admin";
import { DateTime } from "luxon";

const utc8Date = DateTime.now().setZone("Asia/Manila").toJSDate();

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
      ws.send(`[Delete_Admin_Response] Error: Admin with userId ${userId} not found`);
      return;
    }

    const adminData = docSnapshot.data();

    // Prepare data for archive
    const archiveData = {
      email: adminData.email || "",
      firstName: adminData.firstName || "",
      middleName: adminData.middleName || "",
      lastName: adminData.lastName || "",
      password: adminData.password || "",
      deletionDate: utc8Date
    };

    // Archive to AdminArchive
    await firestore.collection("AdminArchive").doc(userId).set(archiveData);
    console.log(`Admin data archived to AdminArchive for ${userId}`);

    // Try deleting from Firebase Auth
    try {
      await admin.auth().deleteUser(userId);
      console.log(`Auth: Deleted user ${userId}`);
    } catch (authError) {
      if (authError.code === "auth/user-not-found") {
        console.warn(`Auth: User ${userId} not found, skipping deletion.`);
      } else {
        throw new Error(`Auth deletion failed: ${authError.message}`);
      }
    }

    // Delete from Admins collection
    await docRef.delete();
    console.log(`Firestore: Deleted document for ${userId}`);

    // ✅ Only one success message sent here
    ws.send(`[Delete_Admin_Response] Success: Admin ${userId} archived and deleted`);

  } catch (error) {
    console.error("DeleteAdmin Error:", error.message);
    ws.send(`[Delete_Admin_Response] Error: ${error.message}`);
  }
}
