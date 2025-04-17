import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleFetchUsers } from "../Controllers/fetchUsers.js";
import { handleFetchTransactions } from "../Controllers/fetchTransactions.js";
import { handleFetchAllUserData } from "../Controllers/fetchEverything.js";
import { handleFetchAdmins } from "../Controllers/fetchAdmins.js";
import { handleInsertAdmin } from "../Controllers/insertAdmins.js";
import { handleDeleteAdmin } from "../Controllers/deleteAdmin.js";
import { handleUpdateAdmin } from "../Controllers/updateAdmin.js";
import { handleInsertUser } from "../Controllers/insertUsers.js";
import { handleDeleteUser } from "../Controllers/deleteUser.js";
import { handleUpdateUser } from "../Controllers/updateUser.js";

dotenv.config();

let socket3Admin = null;

function startSocket3() {
  const port = parseInt(process.env.WS_PORT_3, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log("(Socket 3) New client connected on port", port);
    socket3Admin = ws;

    if (socket3Admin && socket3Admin.readyState === WebSocket.OPEN) {
      console.log("(Socket 3) Sending notify message...");
      socket3Admin.send("[NOTIFY] New client connected to Socket 3");
    }

    ws.on("message", (message) => {
      const msg = message.toString();
      console.log("RAW MESSAGE:", JSON.stringify(msg));

      if (msg.trim().startsWith("[Fetch_Users]")) {
        console.log("Fetching users request received");
        handleFetchUsers(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Transactions]")) {
        console.log("Fetching transactions request received");
        handleFetchTransactions(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_All]")) {
        console.log("Fetching everything received");
        handleFetchAllUserData(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Admins]")) {
        console.log("Fetching admins request received");
        handleFetchAdmins(ws, msg);
      } else if (msg.trim().startsWith("[Insert_Admin]")) {
        console.log("Insert admin request received");
        handleInsertAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Delete_Admin]")) {
        console.log("Delete admin request received");
        handleDeleteAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Update_Admin]")) {
        console.log("Update admin request received");
        handleUpdateAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Insert_User]")) {
        console.log("Update admin request received");
        handleInsertUser(ws, msg);
      } else if (msg.trim().startsWith("[Delete_User]")) {
        console.log("Update admin request received");
        handleDeleteUser(ws, msg);
      } else if (msg.trim().startsWith("[Update_User]")) {
        console.log("Update admin request received");
        handleUpdateUser(ws, msg);
      } else {
        console.log("Unknown command received.");
        ws.send("[ERROR] Unknown command.");
      }
    });

    ws.on("close", () => {
      console.log("(Socket 3) WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("(Socket 3) WebSocket error:", error);
    });
  });

  console.log(`(Socket 3) WebSocket server started on port`, port);
}

export default startSocket3;
