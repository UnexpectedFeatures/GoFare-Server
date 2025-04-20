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

function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export async function handleInsertDriver(ws, message) {
  try {
    const cleanedMessage = message.replace("[Insert_Driver] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = generateUserId();
    const userData = parsed;

    if (!userId || !userData.email) {
      ws.send("[Insert_Driver_Response] Error: User ID and email are required");
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

    const age = userData.birthday ? calculateAge(userData.birthday) : null;

    const dbUserData = {
      email: userData.email,
      firstName: userData.firstName || null,
      middleName: userData.middleName || null,
      lastName: userData.lastName || null,
      password: userData.password || null,
      contactNumber: userData.contactNumber || null,
      birthday: userData.birthday || null,
      age: age,
      driverNo: userData.driverNo || null,
      enabled: true,
      vehicleType: userData.vehicleType || null,
    };

    const firestore = admin.firestore();
    const docRef = firestore.collection("Drivers").doc(userId);
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
      ws.send(`[Insert_Driver_Response] Error: ${authError.message}`);
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
      ws.send(`[Insert_Driver_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(
      `[Insert_Driver_Response] Success: Driver ${userId} created/updated`
    );
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Insert_Driver_Response] Error: ${error.message}`);
  }
}
