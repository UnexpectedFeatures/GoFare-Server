import fetchUser from "../Controllers/fetchUser.js";

export default function handleWebSocket1Message(ws, message) {
  try {
    console.log(message);
    fetchUser(ws, message);
  } catch (error) {
    console.error("Error processing message:", error);
    ws.send(
      JSON.stringify({ type: "error", message: "Internal server error" })
    );
  }
}
