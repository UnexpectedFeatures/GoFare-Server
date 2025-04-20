import admin from "firebase-admin";
import { DateTime } from "luxon";

const utc8Date = DateTime.now().setZone("Asia/Manila").toJSDate();

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
      ws.send(`[Delete_Driver_Response] Error: Driver with userId ${userId} not found`);
      return;
    }

    const driverData = docSnapshot.data();

    // Prepare data for archive
    const archiveData = {
      email: driverData.email,
      firstName: driverData.firstName || null,
      middleName: driverData.middleName || null,
      lastName: driverData.lastName || null,
      birthday: driverData.birthday || null,
      age: driverData.age || null,
      gender: driverData.gender || null,
      address: driverData.address || null,
      contactNumber: driverData.contactNumber || null,
      vehicleType: driverData.vehicleType || null,
      driverNo: driverData.driverNo || null,
      deletionDate: utc8Date
    };

    // Archive to AdminArchive
    await firestore.collection("DriverArchive").doc(userId).set(archiveData);
    console.log(`Driver data archived to DriverArchive for ${userId}`);

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
    ws.send(`[Delete_Driver_Response] Success: Driver ${userId} archived and deleted`);

  } catch (error) {
    console.error("DeleteDriver Error:", error.message);
    ws.send(`[Delete_Driver_Response] Error: ${error.message}`);
  }
}
