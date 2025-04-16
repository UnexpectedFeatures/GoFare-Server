import db from "../database.js";

export const handleFetchUsers = async (ws, message) => {
  try {
    console.log("Fetching users from Firestore...");

    const usersSnapshot = await db.collection("Users").get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    const response = {
      type: "USERS_DATA",
      data: users,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(response));
    } else {
      console.error("WebSocket not open, cannot send users data");
    }
  } catch (error) {
    console.error("Error fetching users:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch users",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
