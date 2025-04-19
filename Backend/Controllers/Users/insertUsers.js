import admin from "firebase-admin";

function generateUserId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
    const userData = JSON.parse(cleanedMessage);

    console.log("Parsed message:", userData);

    const userId = generateUserId();

    console.log("User data:", userData);

    if (!userData || !userData.email) {
      ws.send("[Insert_User_Response] Error: Email is required");
      return;
    }

    const timestamp = admin.firestore.Timestamp.now(); // This is the correct way to create a Timestamp

    const authUserData = {
      uid: userId,
      email: userData.email,
      emailVerified: false,
      disabled: false,
      ...(userData.firstName && { displayName: userData.firstName }),
      ...(userData.password && { password: userData.password }),
    };

    console.log("Auth user data:", authUserData);
    console.log("Birthdate:", userData.birthdate);
    console.log("Birthday:", userData.birthday);

    const dbUserData = {
      address: userData.address || null,
      age: parseInt(userData.age) || null,
      birthday: userData.birthdate || null,
      contactNumber: userData.contactNumber || null,
      email: userData.email,
      firstName: userData.firstName || null,
      gender: userData.gender || null,
      lastName: userData.lastName || null,
      middleName: userData.middleName || null,
      enabled: true,
      creationDate: timestamp,
      updateDate: timestamp,
    };


    const firestore = admin.firestore();
    const docRef = firestore.collection("Users").doc(userId);
    const docSnapshot = await docRef.get();

    const isNewUser = !docSnapshot.exists;

    try {
      if (isNewUser) {
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
      if (isNewUser) {
        await docRef.set(dbUserData);
        console.log(`Firestore: Created document for ${userId}`);
      } else {
        dbUserData.creationDate = docSnapshot.data().creationDate || timestamp; 
        await docRef.update(dbUserData);
        console.log(`Firestore: Updated document for ${userId}`);
      }
    } catch (dbError) {
      console.error("Firestore Error:", dbError.message);
      if (isNewUser) {
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

    if (isNewUser) {
      try {
        const userRfidData = {
          nfc: null,
          registeredAt: null,
          renewedAt: null,
          rfid: null,
          updateDate: timestamp,
        };
        await firestore.collection("UserRFID").doc(userId).set(userRfidData);
        console.log(`Created UserRfid document for ${userId}`);

        const userPinData = {
          pin: null,
          updatedAt: null,
          updateDate: timestamp,
        };
        await firestore.collection("UserPin").doc(userId).set(userPinData);
        console.log(`Created UserPin document for ${userId}`);

        const userWalletData = {
          balance: 0,
          currency: "PHP",
          loaned: false,
          loanedAmount: 0,
          updateDate: timestamp,
        };
        await firestore.collection("UserWallet").doc(userId).set(userWalletData);
        console.log(`Created UserWallet document for ${userId}`);
      } catch (secondaryCollectionsError) {
        console.error("Error creating secondary collections:", secondaryCollectionsError.message);
        try {
          await admin.auth().deleteUser(userId);
          await firestore.collection("Users").doc(userId).delete();
          await firestore.collection("UserRFID").doc(userId).delete();
          await firestore.collection("UserPin").doc(userId).delete();
          await firestore.collection("UserWallet").doc(userId).delete();
          console.log(`Rollback: Deleted user ${userId} and all related documents`);
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError.message);
        }
        ws.send(`[Insert_User_Response] Error: Failed to create secondary collections - ${secondaryCollectionsError.message}`);
        return;
      }
    }

    ws.send(`[Insert_User_Response] Success: User ${userId} created/updated`);
  } catch (error) {
    console.error("General Error:", error.message);
    ws.send(`[Insert_User_Response] Error: ${error.message}`);
  }
}
