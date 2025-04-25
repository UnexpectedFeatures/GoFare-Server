import admin from "firebase-admin";
import { DateTime } from "luxon";

const utc8Date = DateTime.now().setZone("Asia/Manila").toJSDate();

export async function handleDeleteUser(ws, message) {
  try {
    const cleanedMessage = message.replace("[Delete_User] ", "");
    const parsed = JSON.parse(cleanedMessage);
    const userId = parsed.userId;

    if (!userId) {
      ws.send("[Delete_User_Response] Error: User ID is required");
      return;
    }

    console.log("Delete user request received for userId:", userId);

    const firestore = admin.firestore();
    const docRef = firestore.collection("Users").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.log(`User with userId ${userId} not found in Firestore`);
      ws.send(`[Delete_User_Response] Error: User with userId ${userId} not found`);
      return;
    }

    const userData = docSnapshot.data();

    // Prepare data for archive
    const archiveData = {
      email: userData.email || "",
      firstName: userData.firstName || "",
      middleName: userData.middleName || "",
      lastName: userData.lastName || "",
      
      address: userData.address,
      age: userData.age,
      birthday: userData.birthday ,
      contactNumber: userData.contactNumber,
      gender: userData.gender,
      creationDate: userData.creationDate,
      updateDate: userData.updateDate,
      deletionDate: utc8Date
    };

    // Archive to AdminArchive
    await firestore.collection("UserArchive").doc(userId).set(archiveData);
    console.log(`User data archived to UserArchive for ${userId}`);

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
    ws.send(`[Delete_User_Response] Success: User ${userId} archived and deleted`);

  } catch (error) {
    console.error("DeleteUser Error:", error.message);
    ws.send(`[Delete_User_Response] Error: ${error.message}`);
  }
}
