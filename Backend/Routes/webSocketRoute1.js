import fetchUser from "../Controllers/fetchUser.js";

export default function handleWebSocket1Message(ws, message, wss) { 
  try {
    console.log(message);
    fetchUser(ws, message, wss);  
  } catch (error) {
    console.error("Error processing message:", error);
    const errorMessage = JSON.stringify({ type: "error", message: "Internal server error" });
    ws.send(errorMessage);
    if (wss) {
      broadcastToSocket1(wss, errorMessage);
    }
  }
}