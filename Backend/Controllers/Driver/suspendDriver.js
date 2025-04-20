import admin from "firebase-admin";

export async function handleSuspendDriver(ws, message) {
    try {
      const cleanedMessage = message.replace("[Suspend_Driver] ", "");
      const parsed = JSON.parse(cleanedMessage);
  
      const userId = parsed.userId;
      const enabled = parsed.enabled;
  
      if (!userId || typeof enabled !== "boolean") {
        ws.send("[Suspend_Driver_Response] Error: userId and enabled flag are required");
        return;
      }
  
      const firestore = admin.firestore();
      const docRef = firestore.collection("Drivers").doc(userId);
  
      // Check if exists
      const docSnapshot = await docRef.get();
      if (!docSnapshot.exists) {
        ws.send(`[Suspend_Driver_Response] Error: Driver with id ${userId} not found`);
        return;
      }
  
      // Firebase Auth
      try {
        await admin.auth().updateUser(userId, { disabled: !enabled });
      } catch (authError) {
        console.warn("Auth user not found:", authError.message);
        // optionally, inform the client or just skip this step
      }
      
  
      // Firestore
      await docRef.update({ enabled });
  
      ws.send(`[Suspend_Driver_Response] Success: Driver ${userId} is now ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Toggle Enabled Error:", error.message);
      ws.send(`[Suspend_Driver_Response] Error: ${error.message}`);
    }
  }
  