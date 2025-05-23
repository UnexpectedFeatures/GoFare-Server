import db from "../../database.js";

export const handleFetchDrivers = async (ws, message) => {
  try {
    console.log("Fetching Drivers from Firestore...");

    const driversSnapshot = await db.collection("Drivers").get();
    const drivers = [];

    driversSnapshot.forEach((doc) => {
      const driverData = {
        id: doc.id,
        ...doc.data(),
      };

      console.log("Driver data:", driverData);

      drivers.push(driverData);
    });

    const response = {
      type: "Drivers_DATA",
      data: drivers,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(`[Drivers_Data] ${JSON.stringify(drivers)}`);
    } else {
      console.error("WebSocket not open, cannot send Drivers data");
    }
  } catch (error) {
    console.error("Error fetching Drivers:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch Drivers",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
