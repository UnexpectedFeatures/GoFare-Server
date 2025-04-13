import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import handleRegisterAdmin from "../Controllers/AdminLogic/registerController.js";
import fetchAdmins from "../Controllers/AdminLogic/fetchAdmin.js";
import handleDelete from "../Controllers/AdminLogic/handleDelete.js";
import handleEdit from "../Controllers/AdminLogic/handleEdit.js";

dotenv.config();

let socket3Admin = null;

function startAdminSocket() {
  const port = parseInt(process.env.WS_PORT_3, 10);

  if (isNaN(port)) {
    throw new Error("WS_PORT_3 is not defined or invalid in .env");
  }

  const wss = new WebSocketServer({ port });
  console.log(`WebSocket Server listening on port ${port}`);

  wss.on("connection", (ws) => {
    console.log("Client connected to WS 3003");
    socket3Admin = ws;

    console.log("Calling fetchAdmins upon connection...");
    fetchAdmins(ws, "[FetchAdmins]");

    if (socket3Admin && socket3Admin.readyState === WebSocket.OPEN) {
      console.log("Sending notify message...");
      socket3Admin.send("[NOTIFY] New client connected to Socket 3");
    }

    ws.on("message", (message) => {
      const msg = message.toString();
      console.log("RAW MESSAGE:", JSON.stringify(msg));

      if (msg.trim().startsWith("[Register]")) {
        console.log("Registering admin...");
        handleRegisterAdmin(ws, msg);
      } else if (msg.startsWith("[Delete]")) {
        console.log("Handling delete...");
        handleDelete(ws, msg);
      } else if (msg.startsWith("[Suspend]")) {
        console.log("Suspending admin...");
      } else if (msg.startsWith("[Edit]")) {
        console.log("Editing admin...");
        handleEdit(ws, msg);
      } else if (msg.startsWith("[FetchAdmins]")) {
        console.log("Fetching admins upon request...");
        fetchAdmins(ws, msg);
      } else {
        console.log("Unknown command received.");
        ws.send("[ERROR] Unknown command.");
      }
    });

    ws.on("close", () => {
      console.log("A client disconnected.");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });
}

export default startAdminSocket;
