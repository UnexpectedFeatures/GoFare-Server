import db from "../database.js";
import fetchLocation from "./fetchLocationController.js";
import Transaction from "./transactionController.js";

export default async function fetchUser(ws, message, wss) {
  try {
    if (!message.includes("Card Scanned:")) {
      console.log("Ignoring unrelated message:", message);
      return;
    }

    const rfid = message.replace("Card Scanned:", "").trim();
    console.log("Processing RFID:", rfid);

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
    let nodeKey = null;
    snapshot.forEach((childSnapshot) => {
      userData = childSnapshot.val();
      nodeKey = childSnapshot.key; 
    });

    if (!userData || !userData.firstName) {
      throw new Error("User account is not properly configured");
    }

    console.log("RFID matched, user data:", userData);
    console.log("Node key:", nodeKey); 

    const location = await fetchLocation();
    if (!location) {
      throw new Error("Could not retrieve location data");
    }
    console.log("Current location:", location);

    const successMessage = JSON.stringify({
      type: "user_found",
      user: userData,
      location: location,
      nodeKey: nodeKey,
      timestamp: new Date().toISOString(),
    });

    ws.send(successMessage);
    broadcastToSocket1(wss, successMessage);

    await Transaction(
      ws,
      {
        user: userData,
        location: location,
        originalMessage: message,
        nodeKey: nodeKey,
      },
      wss
    );
  } catch (error) {
    console.error("Error in fetchUser:", error);
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
