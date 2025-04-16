import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";
import trainSimulator from "../Services/trainSimulator.js";

dotenv.config();

const allClients = new Set();
let socket1Client = null;

function startSocket2() {
  const port = parseInt(process.env.WS_PORT_2, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 2) New client connected on port", port);
    allClients.add(ws);
    trainSimulator.addWebSocketClient(ws);

    if (socket1Client && socket1Client.readyState === WebSocket.OPEN) {
      socket1Client.send("[NOTIFY] New client connected to Socket 2");
    }

    ws.on("message", (message) => {
      const msg = message.toString();
      console.log("(Socket 2) Message received:", msg);

      if (msg.startsWith("[FORWARDED]")) {
        broadcastToAll(ws, `[FORWARDED] ${msg}`, allClients);
        if (socket1Client && socket1Client.readyState === WebSocket.OPEN) {
          socket1Client.send(msg);
        }
      }
    });

    ws.on("close", () => {
      console.log("(Socket 2) WebSocket connection closed");
      allClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("(Socket 2) WebSocket error:", error);
    });
  });

  console.log(`(Socket 2) WebSocket server started on port`, port);
}

function broadcastToAll(senderWs, message, clientsSet) {
  clientsSet.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export default startSocket2;
