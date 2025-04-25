import admin from "firebase-admin";

export async function handleDeleteArchivedUser(ws, message) {
  try {
    const cleanedMessage = message.replace("[Del_Archive] ", "");
    const parsed = JSON.parse(cleanedMessage);
    const { userId } = parsed;

    if (!userId) {
      ws.send("[Del_Archive_Response] Error: userId is required");
      return;
    }

    const firestore = admin.firestore();
    const archiveRef = firestore.collection("UserArchive").doc(userId);
    const archiveSnap = await archiveRef.get();

    if (!archiveSnap.exists) {
      ws.send(`[Del_Archive_Response] Error: Archived user with userId ${userId} not found`);
      return;
    }

    await archiveRef.delete();
    ws.send(`[Del_Archive_Response] Success: Archived user ${userId} deleted`);
    console.log(`Deleted archived user ${userId} from UserArchive`);
  } catch (err) {
    console.error("Del_Archive Error:", err.message);
    ws.send(`[Del_Archive_Response] Error: ${err.message}`);
  }
}