import admin from "firebase-admin";
import { DateTime } from "luxon";

// Set current date in UTC+8
const currentUTC8Date = DateTime.now().setZone("Asia/Manila");

export async function handleExpiredAdmin(ws = null) {
  try {
    const firestore = admin.firestore();

    const snapshot = await firestore.collection("AdminArchive").get();

    if (snapshot.empty) {
      console.log("No archived admins found.");
      if (ws) ws.send("[Delete_Expired_Admins_Response] No archived admins found.");
      return;
    }

    let deletedCount = 0;

    for (const doc of snapshot.docs) {
      const adminData = doc.data();
      const deletionDate = adminData.deletionDate?.toDate?.(); // Firestore Timestamp to JS Date

      if (!deletionDate) {
        console.warn(`Skipping ${doc.id}: No deletionDate field.`);
        continue;
      }

      const expireDate = DateTime.fromJSDate(deletionDate).plus({ days: 30 }); // Keep for 30 days
      if (currentUTC8Date > expireDate) {
        await firestore.collection("AdminArchive").doc(doc.id).delete();
        console.log(`🧹 Permanently deleted expired archived admin: ${doc.id}`);
        deletedCount++;
      }
    }

    const msg = `[Delete_Expired_Admins_Response] Success: ${deletedCount} expired admins permanently deleted.`;
    if (ws) ws.send(msg);
    else console.log(msg);

  } catch (error) {
    console.error("handleExpiredAdmin Error:", error.message);
    if (ws) ws.send(`[Delete_Expired_Admins_Response] Error: ${error.message}`);
  }
}
