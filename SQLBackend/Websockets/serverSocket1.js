import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";
import fetchUser from "../Controllers/fetchUserController.js";

dotenv.config();

// Track all connected clients
const allClients = new Set(); // This will store all WebSocket connections
let socket2Client = null; // Your special Socket 2 client

function startSocket1() {
  const port = parseInt(process.env.WS_PORT_1, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 1) New client connected on port", port);
    allClients.add(ws);

    if (socket2Client && socket2Client.readyState === WebSocket.OPEN) {
      socket2Client.send("[NOTIFY] New client connected to Socket 1");
    }

    ws.on("message", async (message) => {
      const msg = message.toString();
      console.log("(Socket 1) Message received:", msg);

      if (msg.startsWith("Card Scanned:")) {
        const rfid = msg.substring(13).trim();
        await fetchUser(ws, rfid, allClients);
        return;
      }

      if (!msg.startsWith("[FORWARDED]")) {
        broadcastToAll(ws, `[FORWARDED] ${msg}`, allClients);
        if (socket2Client && socket2Client.readyState === WebSocket.OPEN) {
          socket2Client.send(`[FORWARDED] ${msg}`);
        }
      }
    });

    ws.on("register", () => {
      console.log("Registering.. ");
      
    })

    ws.on("close", () => {
      console.log("(Socket 1) WebSocket connection closed");
      allClients.delete(ws); 
    });
  });

  console.log(`(Socket 1) WebSocket server started on port`, port);
}

function broadcastToAll(senderWs, message, clientsSet) {
  clientsSet.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export default startSocket1;
