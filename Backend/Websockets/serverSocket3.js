import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleFetchUsers } from "../Controllers/Users/fetchUsers.js";
import { handleFetchTransactions } from "../Controllers/fetchTransactions.js";
import { handleFetchAllUserData } from "../Controllers/Users/fetchEverything.js";
import { handleFetchAdmins } from "../Controllers/Admins/fetchAdmins.js";
import { handleInsertAdmin } from "../Controllers/Admins/insertAdmins.js";
import { handleDeleteAdmin } from "../Controllers/Admins/deleteAdmin.js";
import { handleUpdateAdmin } from "../Controllers/Admins/updateAdmin.js";
import { handleInsertUser } from "../Controllers/Users/insertUsers.js";
import { handleDeleteUser } from "../Controllers/Users/deleteUser.js";
import { handleUpdateUser } from "../Controllers/Users/updateUser.js";
import { handleFetchRefundRequests } from "../Controllers/fetchRefundRequests.js";
import { handleApproveRefund } from "../Controllers/approveRefund.js";
import { handleRejectRefund } from "../Controllers/rejectRefund.js";

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
      if (ws.readyState === WebSocket.OPEN) {
        console.log("Connection is open");
      }
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
      } else if (msg.trim().startsWith("[FetchRefunds]")) {
        console.log("Fetching refunds request received");
        handleFetchRefundRequests(ws, msg);
      } else if (msg.trim().startsWith("[ApproveRefund]")) {
        console.log("Approve refund request received");
        handleApproveRefund(ws, msg);
      } else if (msg.trim().startsWith("[RejectRefund]")) {
        console.log("Reject refund request received");
        handleRejectRefund(ws, msg);
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
