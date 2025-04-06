import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";

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

  socket2Client = new WebSocket(`ws://localhost:${process.env.WS_PORT_2}`);
  socket2Client.on("open", () => {
    console.log("(Socket 1) Connected to Socket 2");
  });
  socket2Client.on("message", (data) => {
    const msg = data.toString();
    console.log("(Socket 1) Received from Socket 2:", msg);
  });

  console.log(`(Socket 1) WebSocket server started on port`, port);
}

export default startSocket1;
