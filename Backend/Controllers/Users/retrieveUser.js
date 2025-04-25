import db from "../../database.js";

export const handleRetrieveUser = async (ws, message) => {
  try {
    const cleanedMessage = message.replace("[Retrieve_User] ", "");
    const { userId } = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Retrieve_User_Response] Error: userId is required");
      return;
    }

    const archiveRef = db.collection("UserArchive").doc(userId);
    const archiveSnapshot = await archiveRef.get();

    if (!archiveSnapshot.exists) {
      ws.send(`[Retrieve_User_Response] Error: User with ID ${userId} not found in archive`);
      return;
    }

    const { email, firstName, middleName, lastName, address, age, contactNumber, gender, birthday, creationDate, updateDate} = archiveSnapshot.data();

    const newUser = {
      email,
      firstName,
      middleName,
      lastName,
      address,
      age,
      contactNumber,
      gender,
      birthday,
      creationDate,
      updateDate,
      enabled: true
    };

    await db.collection("Users").doc(userId).set(newUser);
    await archiveRef.delete();

    ws.send(`[Retrieve_User_Response] Success: User ${userId} has been restored`);
  } catch (error) {
    console.error("Retrieve User Error:", error);
    ws.send(`[Retrieve_User_Response] Error: ${error.message}`);
  }
};
