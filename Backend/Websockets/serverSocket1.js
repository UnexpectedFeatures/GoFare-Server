import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";
import { findUserByRfidOrNfc } from "../Controllers/userController.js";

dotenv.config();

export const allClients = new Set();
let socket2Client = null;

const lastScannedMap = new Map();
const COOLDOWN_MS = 5000;

export function broadcastToAll(senderWs, message, clientsSet) {
  clientsSet.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

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
        const now = Date.now();

        const lastScannedTime = lastScannedMap.get(rfid);

        if (lastScannedTime && now - lastScannedTime < COOLDOWN_MS) {
          console.log(`(Socket 1) RFID ${rfid} ignored (cooldown active)`);
          ws.send(
            JSON.stringify({
              type: "COOLDOWN",
              message:
                "This card was just scanned. Please wait 5 seconds before trying again.",
            })
          );
          return;
        }

        lastScannedMap.set(rfid, now);

        try {
          const userInfo = await findUserByRfidOrNfc(rfid);
          if (userInfo) {
            ws.send(
              JSON.stringify({
                type: "USER_INFO",
                data: userInfo,
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "User not found",
              })
            );
          }
        } catch (error) {
          console.error("Error processing RFID scan:", error);
          ws.send(
            JSON.stringify({
              type: "ERROR",
              message: "Error processing request",
            })
          );
        }
        return;
      }

      if (!msg.startsWith("[FORWARDED]")) {
        broadcastToAll(ws, `[FORWARDED] ${msg}`, allClients);
        if (socket2Client && socket2Client.readyState === WebSocket.OPEN) {
          socket2Client.send(`[FORWARDED] ${msg}`);
        }
      }
    });

    ws.on("close", () => {
      console.log("(Socket 1) WebSocket connection closed");
      allClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("(Socket 1) WebSocket error:", error);
    });
  });

  console.log(`(Socket 1) WebSocket server started on port`, port);
}

setInterval(() => {
  const now = Date.now();
  for (const [rfid, timestamp] of lastScannedMap.entries()) {
    if (now - timestamp > COOLDOWN_MS) {
      lastScannedMap.delete(rfid);
    }
  }
}, 60000);

export default startSocket1;
