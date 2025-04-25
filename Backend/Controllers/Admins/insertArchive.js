import admin from "firebase-admin";

export async function insertToArchive(userId, adminData) {
  try {
    const firestore = admin.firestore();

    // Extract only selected fields
    const { email, firstName, middleName, lastName, password, adminLevel } = adminData;

    const archiveData = {
      email,
      firstName,
      middleName,
      lastName,
      password,
      adminLevel,
    };

    // Insert to AdminArchive collection
    await firestore.collection("AdminArchive").doc(userId).set(archiveData);

    console.log(`Archived admin ${userId} successfully.`);
  } catch (error) {
    console.error("Insert to archive failed:", error.message);
    throw error; // Let caller handle this if needed
  }
}