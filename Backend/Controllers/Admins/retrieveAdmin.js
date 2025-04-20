import db from "../../database.js";

export const handleRetrieveAdmin = async (ws, message) => {
  try {
    const cleanedMessage = message.replace("[Retrieve_Admin] ", "");
    const { userId } = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Retrieve_Admin_Response] Error: userId is required");
      return;
    }

    const archiveRef = db.collection("AdminArchive").doc(userId);
    const archiveSnapshot = await archiveRef.get();

    if (!archiveSnapshot.exists) {
      ws.send(`[Retrieve_Admin_Response] Error: Admin with ID ${userId} not found in archive`);
      return;
    }

    const { email, firstName, middleName, lastName, password } = archiveSnapshot.data();

    const newAdmin = {
      email,
      firstName,
      middleName,
      lastName,
      password,
      enabled: true
    };

    await db.collection("Admins").doc(userId).set(newAdmin);
    await archiveRef.delete();

    ws.send(`[Retrieve_Admin_Response] Success: Admin ${userId} has been restored`);
  } catch (error) {
    console.error("Retrieve Admin Error:", error);
    ws.send(`[Retrieve_Admin_Response] Error: ${error.message}`);
  }
};
