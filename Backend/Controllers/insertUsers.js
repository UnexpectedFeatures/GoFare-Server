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

export async function handleInsertUser(ws, message) {
  try {
    const cleanedMessage = message.replace("[Insert_User] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = generateUserId();
    const userData = parsed.data;

    if (!userId || !userData.email) {
      ws.send("[Insert_User_Response] Error: User ID and email are required");
      return;
    }

    const now = new Date();
    const creationDate = `${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}/${String(now.getDate()).padStart(2, "0")}/${now.getFullYear()}`;
    const timestamp = admin.firestore.Timestamp.now();

    const authUserData = {
      uid: userId,
      email: userData.email,
      emailVerified: false,
      disabled: false,
      ...(userData.firstName && { displayName: userData.firstName }),
      ...(userData.password && { password: userData.password }),
    };

    const dbUserData = {
      address: userData.address || null,
      age: typeof userData.age === "number" ? userData.age : null,
      birthday: userData.birthday || null,
      contactNumber: userData.contactNumber || null,
      email: userData.email,
      firstName: userData.firstName || null,
      gender: userData.gender || null,
      lastName: userData.lastName || null,
      middleName: userData.middleName || null,
      enabled: true,
      creationDate: creationDate,
      updateDate: timestamp,
    };

    const firestore = admin.firestore();
    const docRef = firestore.collection("Users").doc(userId);
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
      ws.send(`[Insert_User_Response] Error: ${authError.message}`);
      return;
    }

    try {
      if (!docSnapshot.exists) {
        await docRef.set(dbUserData);
        console.log(`Firestore: Created document for ${userId}`);
      } else {
        dbUserData.creationDate =
          docSnapshot.data().creationDate || creationDate; 
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
      ws.send(`[Insert_User_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Insert_User_Response] Success: User ${userId} created/updated`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Insert_User_Response] Error: ${error.message}`);
  }
}
