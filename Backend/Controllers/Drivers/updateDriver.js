import admin from "firebase-admin";

function calculateAge(birthday) {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

export async function handleUpdateDriver(ws, message) {
  try {
    const cleanedMessage = message.replace("[Update_Driver] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;
    const updatedData = parsed.updatedData;

    if (!userId) {
      ws.send("[Update_Driver_Response] Error: Driver ID is required");
      return;
    }

    const firestore = admin.firestore();
    const docRef = firestore.collection("Drivers").doc(userId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      ws.send(
        `[Update_Driver_Response] Error: Driver with id ${userId} not found`
      );
      return;
    }

    if (updatedData.birthday) {
      updatedData.age = calculateAge(updatedData.birthday);
    }

    const authUserData = {
      ...(updatedData.email && { email: updatedData.email }),
      ...(updatedData.firstName && { displayName: updatedData.firstName }),
      ...(updatedData.password && { password: updatedData.password }),
    };

    try {
      const existingUser = await admin.auth().getUser(userId);
      console.log(`Auth: User ${userId} exists`);

      if (Object.keys(authUserData).length > 0) {
        await admin.auth().updateUser(userId, authUserData);
        console.log(`Auth: Updated user ${userId}`);
      }
    } catch (authError) {
      if (authError.code === "auth/user-not-found") {
        console.log(`Auth: User ${userId} not found in Firebase Auth`);
      } else {
        console.error("Auth Error:", authError.message);
        ws.send(`[Update_Driver_Response] Error: ${authError.message}`);
        return;
      }
    }

    try {
      await docRef.update(updatedData);
      console.log(`Firestore: Updated document for ${userId}`);
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      ws.send(`[Update_Driver_Response] Error: ${dbError.message}`);
      return;
    }

    ws.send(`[Update_Driver_Response] Success: Driver ${userId} updated`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Update_Driver_Response] Error: ${error.message}`);
  }
}
