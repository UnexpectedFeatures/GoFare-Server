import { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

function startSocket2() {
  const port = process.env.WS_PORT_2;

  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 2) New connection on port", port);

    ws.on("message", (message) => {
      console.log("(Socket 2) Message received:", message.toString());
    });

    ws.on("close", () => {
      console.log("(Socket 2) WebSocket connection closed");
    });
  });

  console.log(`(Socket 2) WebSocket server started on port ${port}`);
}

export default startSocket2;
