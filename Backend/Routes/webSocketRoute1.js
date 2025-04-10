import fetchUser from "../Controllers/fetchUser.js";

export default function handleWebSocket1Messages(ws, message, wss) {
  try {
    console.log("Received message:", message);
    fetchUser(ws, message, wss);
  } catch (error) {
    console.error("Error processing message:", error);
    const errorMessage = JSON.stringify({
      type: "error",
      message: "Internal server error",
    });
    ws.send(errorMessage);
    if (wss) {
      broadcastToSocket1(wss, errorMessage);
    }
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
