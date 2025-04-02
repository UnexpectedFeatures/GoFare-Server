import { WebSocketServer } from "ws";

export function startServerWebsocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established.");

    ws.on("message", (data) => {
      const message = data.toString(); 
      console.log("Received data from client:", message);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed.");
    });
  });

  console.log(
    `WebSocket server started on the same port as Express`
  );
}

export default startServerWebsocket;
