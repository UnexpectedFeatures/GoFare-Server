import { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

function startSocket1() {
  const port = process.env.WS_PORT_1;

  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 1) New connection on port", port);

    ws.on("message", (message) => {
      console.log("(Socket 1) Message received:", message.toString());
    });

    ws.on("close", () => {
      console.log("(Socket 1) WebSocket connection closed");
    });
  });

  console.log(`(Socket 1) WebSocket server started on port ${port}`);
}

export default startSocket1;
