import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { handleFetchTransactions } from "../Controllers/fetchTransactions.js";

import { handleFetchTargetAdmin } from "../Controllers/Admins/fetchTargetAdmin.js";
import { handleFetchAdmins } from "../Controllers/Admins/fetchAdmins.js";
import { handleFetchArchiveAdmins } from "../Controllers/Admins/fetchArchive.js";
import { handleInsertAdmin } from "../Controllers/Admins/insertAdmins.js";
import { handleDeleteAdmin } from "../Controllers/Admins/deleteAdmin.js";
import { handleUpdateAdmin } from "../Controllers/Admins/updateAdmin.js";
import { handleExpiredAdmin } from "../Controllers/Admins/deleteExpiredAdmin.js";
import { handleSuspendAdmin } from "../Controllers/Admins/suspendAdmin.js";
import { handleRetrieveAdmin } from "../Controllers/Admins/retrieveAdmin.js";

import { handleFetchTargetDriver } from "../Controllers/Driver/fetchTargetDriver.js";
import { handleFetchDrivers } from "../Controllers/Driver/fetchDrivers.js";
import { handleFetchArchiveDrivers } from "../Controllers/Driver/fetchArchive.js";
import { handleInsertDriver } from "../Controllers/Driver/insertDrivers.js";
import { handleDeleteDriver } from "../Controllers/Driver/deleteDriver.js";
import { handleUpdateDriver } from "../Controllers/Driver/updateDriver.js";
import { handleExpiredDriver } from "../Controllers/Driver/deleteExpiredDriver.js";
import { handleSuspendDriver } from "../Controllers/Driver/suspendDriver.js";
import { handleRetrieveDriver } from "../Controllers/Driver/retrieveDriver.js";


import { handleFetchUsers } from "../Controllers/Users/fetchUsers.js";
import { handleFetchAllUserData } from "../Controllers/Users/fetchEverything.js";
import { handleInsertUser } from "../Controllers/Users/insertUsers.js";
import { handleDeleteUser } from "../Controllers/Users/deleteUser.js";
import { handleUpdateUser } from "../Controllers/Users/updateUser.js";

import { handleFetchRefundRequests } from "../Controllers/Refund/fetchRefundRequests.js";
import { handleApproveRefund } from "../Controllers/Refund/approveRefund.js";
import { handleRejectRefund } from "../Controllers/Refund/rejectRefund.js";
import { handleDeactivateRFID } from "../Controllers/RFID-NFC/deactivateRFID.js";
import { handleActivateRFID } from "../Controllers/RFID-NFC/activateRFID.js";
import { handleDeactivateNFC } from "../Controllers/RFID-NFC/deactivateNFC.js";
import { handleActivateNFC } from "../Controllers/RFID-NFC/activateNFC.js";
import { handleRefundRequests } from "../Controllers/Refund/requestRefund.js";
import { handleFetchRejectedRefunds } from "../Controllers/Refund/fetchRefundRejected.js";
import { handleFetchApprovedRefunds } from "../Controllers/Refund/fetchRefundApproved.js";

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
      } else if (msg.trim().startsWith("[Fetch_Admins_Archive]")) {
        console.log("Fetching admin's archive request received");
        handleFetchArchiveAdmins(ws, msg);
      } else if (msg.trim().startsWith("[Insert_Admin]")) {
        console.log("Insert admin request received");
        handleInsertAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Suspend_Admin]")) {
        console.log("Suspend admin request received");
        handleSuspendAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Delete_Admin]")) {
        console.log("Delete admin request received");
        handleDeleteAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Delete_Expired_Admins]")) {
        console.log("Delete expired admin archive request received");
        handleExpiredAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Update_Admin]")) {
        console.log("Update admin request received");
        handleUpdateAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Retrieve_Admin]")) {
        console.log("Update admin request received");
        handleRetrieveAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Target_Admin]")) {
        console.log("Fetching admins request received");
        handleFetchTargetAdmin(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Target_Driver]")) {
        console.log("Fetching admins request received");
        handleFetchTargetDriver(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Drivers]")) {
        console.log("Fetching admins request received");
        handleFetchDrivers(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Drivers_Archive]")) {
        console.log("Fetching admin's archive request received");
        handleFetchArchiveDrivers(ws, msg);
      } else if (msg.trim().startsWith("[Insert_Driver]")) {
        console.log("Insert admin request received");
        handleInsertDriver(ws, msg);
      } else if (msg.trim().startsWith("[Suspend_Driver]")) {
        console.log("Suspend admin request received");
        handleSuspendDriver(ws, msg);
      } else if (msg.trim().startsWith("[Delete_Driver]")) {
        console.log("Delete admin request received");
        handleDeleteDriver(ws, msg);
      } else if (msg.trim().startsWith("[Delete_Expired_Drivers]")) {
        console.log("Delete expired admin archive request received");
        handleExpiredDriver(ws, msg);
      } else if (msg.trim().startsWith("[Update_Driver]")) {
        console.log("Update admin request received");
        handleUpdateDriver(ws, msg);
      } else if (msg.trim().startsWith("[Retrieve_Driver]")) {
        console.log("Update admin request received");
        handleRetrieveDriver(ws, msg);
      } else if (msg.trim().startsWith("[Insert_User]")) {
        console.log("Insert user request received");
        handleInsertUser(ws, msg);
      } else if (msg.trim().startsWith("[Delete_User]")) {
        console.log("Delete admin request received");
        handleDeleteUser(ws, msg);
      } else if (msg.trim().startsWith("[Update_User]")) {
        console.log("Update admin request received");
        handleUpdateUser(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Refunds_Unapproved]")) {
        console.log("Fetching refunds unapproved request received");
        handleFetchRefundRequests(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Refunds_Approved]")) {
        console.log("Fetching refunds approved request received");
        handleFetchApprovedRefunds(ws, msg);
      } else if (msg.trim().startsWith("[Fetch_Refunds_Rejected]")) {
        console.log("Fetching refunds rejected request received");
        handleFetchRejectedRefunds(ws, msg);
      } else if (msg.trim().startsWith("[Approve_Refund]")) {
        console.log("Approve refund request received");
        handleApproveRefund(ws, msg);
      } else if (msg.trim().startsWith("[Reject_Refund]")) {
        console.log("Reject refund request received");
        handleRejectRefund(ws, msg);
      } else if (msg.trim().startsWith("[Request_Refund]")) {
        console.log("Request refund request received");
        handleRefundRequests(ws, msg);
      } else if (msg.trim().startsWith("[Deactivate_RFID]")) {
        console.log("Deactivate RFID request received");
        handleDeactivateRFID(ws, msg);
      } else if (msg.trim().startsWith("[Activate_RFID]")) {
        handleActivateRFID(ws, msg);
        console.log("Activate RFID received");
      } else if (msg.trim().startsWith("[Deactivate_NFC]")) {
        handleDeactivateNFC(ws, msg);
        console.log("Deactivate NFC received");
      } else if (msg.trim().startsWith("[Activate_NFC]")) {
        handleActivateNFC(ws, msg);
        console.log("Activate NFC received");
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


setInterval(() => {
  console.log("🧪 TESTING: Running expired admin cleanup...");
  handleExpiredAdmin();
}, 60 * 2000);

export default startSocket3;
