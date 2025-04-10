import db from "../database.js";

export default async function fetchUser(ws, message, wss) {
  try {
    if (!message.includes("Card Scanned:")) {
      console.log("Ignoring unrelated message:", message);
      return;
    }

    const rfid = message.replace("Card Scanned:", "").trim();

    if (!rfid) {
      throw new Error("RFID is missing");
    }

    const userRef = db.ref("ClientReference");
    const snapshot = await userRef
      .orderByChild("rfid")
      .equalTo(rfid)
      .once("value");

    if (!snapshot.exists()) {
      console.log("No match for RFID:", rfid);
      const errorMessage = JSON.stringify({
        type: "error",
        message: "No user found with this RFID",
      });
      ws.send(errorMessage);
      broadcastToSocket1(wss, errorMessage);
      return;
    }

    let userData = null;
    snapshot.forEach((childSnapshot) => {
      if (!userData) {
        userData = childSnapshot.val();
      }
    });

    if (!userData || userData.firstName === "") {
      throw new Error("User account is not properly configured");
    }

    console.log("RFID matched, user data:", userData);
    const successMessage = JSON.stringify({
      type: "success",
      message: "User found",
      data: userData,
    });
    ws.send(successMessage);
    broadcastToSocket1(wss, successMessage);
  } catch (error) {
    console.error("Error processing message:", error);
    const errorMessage = JSON.stringify({
      type: "error",
      message: error.message,
    });
    ws.send(errorMessage);
    broadcastToSocket1(wss, errorMessage);
  }
}

function broadcastToSocket1(wss, message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
