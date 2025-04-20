import admin from "firebase-admin";

function generateUserId() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let userId = "";
  for (let i = 0; i < 28; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    userId += characters.charAt(randomIndex);
  }
  return userId;
}

export async function handleInsertAdmin(ws, message) {
  try {
    const cleanedMessage = message.replace("[Insert_Admin] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = generateUserId();
    const userData = parsed.data;

    if (!userId || !userData.email) {
      ws.send("[Insert_Admin_Response] Error: User ID and email are required");
      return;
    }

    const authUserData = {
      uid: userId,
      email: userData.email,
      emailVerified: false,
      disabled: false,
      ...(userData.firstName && { displayName: userData.firstName }),
      ...(userData.password && { password: userData.password }),
    };

    const dbUserData = {
      email: userData.email,
      firstName: userData.firstName || null,
      middleName: userData.middleName || null,
      lastName: userData.lastName || null,
      password: userData.password || null,
      enabled: true
    };

    const firestore = admin.firestore();
    const docRef = firestore.collection("Admins").doc(userId);
    const docSnapshot = await docRef.get();

    try {
      if (!docSnapshot.exists) {
        await admin.auth().createUser(authUserData);
        console.log(`Auth: Created user ${userId}`);
      } else {
        await admin.auth().updateUser(userId, authUserData);
        console.log(`Auth: Updated user ${userId}`);
      }
    } catch (authError) {
      console.error("Auth Error:", authError.message);
      ws.send(`[Insert_Admin_Response] Error: ${authError.message}`);
      return;
    }

    try {
      if (!docSnapshot.exists) {
        await docRef.set(dbUserData);
        console.log(`Firestore: Created document for ${userId}`);
      } else {
        await docRef.update(dbUserData);
        console.log(`Firestore: Updated document for ${userId}`);
      }
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      if (!docSnapshot.exists) {
        try {
          await admin.auth().deleteUser(userId);
          console.log(`Rollback: Deleted user ${userId}`);
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError.message);
        }
      }
      ws.send(`[Insert_Admin_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Insert_Admin_Response] Success: Admin ${userId} created/updated`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Insert_Admin_Response] Error: ${error.message}`);
  }
}
