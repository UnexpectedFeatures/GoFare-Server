import admin from "firebase-admin";

export async function handleSuspendAdmin(ws, message) {
    try {
      const cleanedMessage = message.replace("[Suspend_Admin] ", "");
      const parsed = JSON.parse(cleanedMessage);
  
      const userId = parsed.userId;
      const enabled = parsed.enabled;
  
      if (!userId || typeof enabled !== "boolean") {
        ws.send("[Suspend_Admin_Response] Error: userId and enabled flag are required");
        return;
      }
  
      const firestore = admin.firestore();
      const docRef = firestore.collection("Admins").doc(userId);
  
      // Check if exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        ws.send(`[Suspend_Admin_Response] Error: Admin with id ${userId} not found`);
        return;
      }
  
      // Firebase Auth
      await admin.auth().updateUser(userId, { disabled: !enabled });
  
      // Firestore
      await docRef.update({ enabled });
  
      ws.send(`[Suspend_Admin_Response] Success: Admin ${userId} is now ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Toggle Enabled Error:", error.message);
      ws.send(`[Suspend_Admin_Response] Error: ${error.message}`);
    }
  }
  