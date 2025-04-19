import db from "../../database.js";

export const handleFetchAdmins = async (ws, message) => {
  try {
    console.log("Fetching Admins from Firestore...");

    const AdminsSnapshot = await db.collection("Admins").get();
    const Admins = [];

    AdminsSnapshot.forEach((doc) => {
      const adminData = {
        id: doc.id, // this is the document ID
        ...doc.data(),
      };

      // Log each admin's documentId and other fields
      console.log("Admin data:", adminData);

      Admins.push(adminData);
    });

    const response = {
      type: "Admins_DATA",
      data: Admins,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(`[Admins_Data] ${JSON.stringify(Admins)}`);
    } else {
      console.error("WebSocket not open, cannot send Admins data");
    }
  } catch (error) {
    console.error("Error fetching Admins:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch Admins",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
