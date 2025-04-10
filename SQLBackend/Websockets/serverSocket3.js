import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import handleRegisterAdmin from "../Controllers/AdminLogic/registerController.js";
import fetchAdmins from "../Controllers/AdminLogic/fetchAdmin.js";
import handleDelete from "../Controllers/AdminLogic/handleDelete.js";


dotenv.config();

function startAdminSocket() {
  const port = parseInt(process.env.WS_PORT_3, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      const msg = message.toString();

      if (msg.startsWith("[Register]")) {
        handleRegisterAdmin(ws, msg);
      } else if (msg.startsWith("[Delete]")) {
        handleDelete(ws, msg);
      } else if (msg.startsWith("[Suspend]")) {
        handleSuspend(ws, msg);
      } else {
        ws.send("[ERROR] Unknown command.");
      }
    });

    ws.on("close", () => {});
    ws.on("error", (error) => {});
  });
}

export default startAdminSocket;
