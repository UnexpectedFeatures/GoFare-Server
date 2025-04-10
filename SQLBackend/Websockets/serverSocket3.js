import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import handleRegisterAdmin from "../Controllers/AdminLogic/registerController.js";
import fetchAdmins from "../Controllers/AdminLogic/fetchAdmin.js";
import handleDelete from "../Controllers/AdminLogic/handleDelete.js";
import handleEdit from "../Controllers/AdminLogic/handleEdit.js";
import handleSuspend from "../Controllers/AdminLogic/handleSuspend.js";

dotenv.config();

function startAdminSocket() {
  const port = parseInt(process.env.WS_PORT_3, 10);
  const wss = new WebSocketServer({ port });
  console.log(`(Socket 3) WebSocket server started on port ${port}`);

  wss.on("connection", (ws) => {
    fetchAdmins(ws, "[FetchAdmins]");

    ws.on("message", (message) => {
      const msg = message.toString();

      if (msg.startsWith("[Register]")) {
        handleRegisterAdmin(ws, msg);
      } else if (msg.startsWith("[Delete]")) {
        handleDelete(ws, msg);
      } else if (msg.startsWith("[Suspend]")) {
        handleSuspend(ws, msg);
      } else if (msg.startsWith("[Edit]")) {
        handleEdit(ws, msg);
      } else if (msg.startsWith("[FetchAdmins]")) {
        fetchAdmins(ws, msg);
      } else {
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
