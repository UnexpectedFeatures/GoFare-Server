import db from "../../database.js";

export const handleFetchArchiveUsers = async (ws, message) => {
  try {
    console.log("Fetching Users from Firestore...");

    const UsersSnapshot = await db.collection("UserArchive").get();
    const Users = [];

    UsersSnapshot.forEach((doc) => {
      const userData = {
        id: doc.id, 
        ...doc.data(),
      };

      console.log("User data:", userData);

      Users.push(userData);
    });

    const response = {
      type: "Users_DATA",
      data: Users,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(`[Users_Archive] ${JSON.stringify(Users)}`);
    } else {
      console.error("WebSocket not open, cannot send Users data");
    }
  } catch (error) {
    console.error("Error fetching Users:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch Users",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
