import { WebSocketServer } from "ws";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

let socket1Client = null;

function startSocket2() {
  const port = parseInt(process.env.WS_PORT_2, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 2) New client connected on port", port);

    if (socket1Client && socket1Client.readyState === WebSocket.OPEN) {
      socket1Client.send("[NOTIFY] New client connected to Socket 2");
    }

    ws.on("message", (message) => {
      const msg = message.toString();
      console.log("(Socket 2) Message received:", msg);

      if (!msg.startsWith("[FORWARDED]")) {
        if (socket1Client && socket1Client.readyState === WebSocket.OPEN) {
          socket1Client.send(`[FORWARDED] ${msg}`);
        }
      }
    });

    ws.on("close", () => {
      console.log("(Socket 2) WebSocket connection closed");
    });
  });

  socket1Client = new WebSocket(`ws://localhost:${process.env.WS_PORT_1}`);
  socket1Client.on("open", () => {
    console.log("(Socket 2) Connected to Socket 1");
  });
  socket1Client.on("message", (data) => {
    const msg = data.toString();
    console.log("(Socket 2) Received from Socket 1:", msg);
  });

  console.log(`(Socket 2) WebSocket server started on port`, port);
}

export default startSocket2;
