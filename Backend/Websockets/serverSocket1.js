import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";
import handleWebSocket1Message from "../Routes/webSocketRoute1.js";

dotenv.config();

let socket2Client = null;

function startSocket1() {
  const port = parseInt(process.env.WS_PORT_1, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 1) New client connected on port", port);

    if (socket2Client && socket2Client.readyState === WebSocket.OPEN) {
      socket2Client.send("[NOTIFY] New client connected to Socket 1");
    }

    ws.on("message", (message) => {
      const msg = message.toString();
      console.log("(Socket 1) Message received:", msg);

      handleWebSocket1Message(ws, msg, wss); 

      if (!msg.startsWith("[FORWARDED]")) {
        if (socket2Client && socket2Client.readyState === WebSocket.OPEN) {
          socket2Client.send(`[FORWARDED] ${msg}`);
        }
      }
    });

    ws.on("close", () => {
      console.log("(Socket 1) WebSocket connection closed");
    });
  });

  console.log(`(Socket 1) WebSocket server started on port`, port);
}
export default startSocket1;
