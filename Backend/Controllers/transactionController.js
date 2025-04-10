import db from "../database.js";

export default async function PassengerRecord(ws, data, wss) {
  try {
    console.log("Starting passenger recording...");

    if (!data.user || !data.location) {
      throw new Error("Incomplete passenger data");
    }

    const user = data.user;
    const location = data.location;

    const passengerRef = db.ref("Passengers").push();
    await passengerRef.set({
      userId: user.rfid,
      userName: `${user.firstName} ${user.lastName}`,
      location: location.stopName,
      route: location.routeName,
      timestamp: new Date().toISOString(),
    });

    const successMessage = JSON.stringify({
      type: "passenger_recorded",
      status: "success",
      user: {
        rfid: user.rfid,
        name: `${user.firstName} ${user.lastName}`,
      },
      location: {
        stopName: location.stopName,
        routeName: location.routeName,
      },
      timestamp: new Date().toISOString(),
    });

    ws.send(successMessage);
    broadcastToSocket1(wss, successMessage);
    console.log("Passenger recorded successfully");
  } catch (error) {
    console.error("Passenger recording error:", error);
    const errorMessage = JSON.stringify({
      type: "recording_error",
      message: error.message,
      timestamp: new Date().toISOString(),
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
