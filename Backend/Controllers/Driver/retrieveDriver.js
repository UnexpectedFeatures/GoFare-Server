import db from "../../database.js";

export const handleRetrieveDriver = async (ws, message) => {
  try {
    const cleanedMessage = message.replace("[Retrieve_Driver] ", "");
    const { userId } = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Retrieve_Driver_Response] Error: userId is required");
      return;
    }

    const archiveRef = db.collection("DriverArchive").doc(userId);
    const archiveSnapshot = await archiveRef.get();

    if (!archiveSnapshot.exists) {
      ws.send(`[Retrieve_Driver_Response] Error: Driver with ID ${userId} not found in archive`);
      return;
    }

    
    const driverData = archiveSnapshot.data();

    const newDriver = {
      email: driverData.email,
      firstName: driverData.firstName || null,
      middleName: driverData.middleName || null,
      lastName: driverData.lastName || null,
      birthday: driverData.birthday || null,
      age: driverData.age || null,
      gender: driverData.gender || null,
      address: driverData.address || null,
      contactNumber: driverData.contactNumber || null,
      vehicleType: driverData.vehicleType || null,
      driverNo: driverData.driverNo || null,
      enabled: true
    };

    await db.collection("Drivers").doc(userId).set(newDriver);
    await archiveRef.delete();

    ws.send(`[Retrieve_Driver_Response] Success: Driver ${userId} has been restored`);
  } catch (error) {
    console.error("Retrieve Driver Error:", error);
    ws.send(`[Retrieve_Driver_Response] Error: ${error.message}`);
  }
};
