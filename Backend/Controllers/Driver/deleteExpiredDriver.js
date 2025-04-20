import admin from "firebase-admin";
import { DateTime } from "luxon";

// Set current date in UTC+8
const currentUTC8Date = DateTime.now().setZone("Asia/Manila");

export async function handleExpiredDriver(ws = null) {
  try {
    const firestore = admin.firestore();

    const snapshot = await firestore.collection("DriverArchive").get();

    if (snapshot.empty) {
      console.log("No archived drivers found.");
      if (ws) ws.send("[Delete_Expired_Drivers_Response] No archived drivers found.");
      return;
    }

    let deletedCount = 0;

    for (const doc of snapshot.docs) {
      const driverData = doc.data();
      const deletionDate = driverData.deletionDate?.toDate?.(); // Firestore Timestamp to JS Date

      if (!deletionDate) {
        console.warn(`Skipping ${doc.id}: No deletionDate field.`);
        continue;
      }

      const expireDate = DateTime.fromJSDate(deletionDate).plus({ days: 30 }); // Keep for 30 days
      if (currentUTC8Date > expireDate) {
        await firestore.collection("DriverArchive").doc(doc.id).delete();
        console.log(`🧹 Permanently deleted expired archived driver: ${doc.id}`);
        deletedCount++;
      }
    }

    const msg = `[Delete_Expired_Drivers_Response] Success: ${deletedCount} expired drivers permanently deleted.`;
    if (ws) ws.send(msg);
    else console.log(msg);

  } catch (error) {
    console.error("handleExpiredDriver Error:", error.message);
    if (ws) ws.send(`[Delete_Expired_Drivers_Response] Error: ${error.message}`);
  }
}
