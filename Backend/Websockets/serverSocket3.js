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
import { handleToggleUserStatus } from "../Controllers/Users/changeStatusUser.js";
import { handleProvideRFID } from "../Controllers/RFID-NFC/provideRFID.js";
import { handleProvideNFC } from "../Controllers/RFID-NFC/provideNFC.js";
import { handleFetchArchivedUsers } from "../Controllers/Users/fetchedArchivedUsers.js";
import { handleDeleteArchivedUser } from "../Controllers/Users/deleteArchive.js";
import { handleFetchRequests } from "../Controllers/Requests/fetchEverythingRequest.js";
import { handleFetchSpecificRequest } from "../Controllers/Requests/fetchSpecificRequest.js";
import { handleFetchUserRequests } from "../Controllers/Requests/fetchUserRequests.js";
import { handleResolveRequest } from "../Controllers/Requests/resolveRequest.js";
import { handlePostponeRequest } from "../Controllers/Requests/postponeRequest.js";
import { fetchGrossYesterday } from "../Controllers/Stripe/grossVolumeYesterday.js";
import { fetchGrossToday } from "../Controllers/Stripe/grossVolumeToday.js";
import { handleInsertDriver } from "../Controllers/Drivers/insertDriver.js";
import { handleUpdateDriver } from "../Controllers/Drivers/updateDriver.js";
import { handleFetchDrivers } from "../Controllers/Drivers/fetchDriver.js";
import { handleDeleteDriver } from "../Controllers/Drivers/deleteDriver.js";
import { depositToUser } from "../Services/stripe.js";

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
      const data = JSON.parse(msg);
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
        console.log("Insert user request received");
        handleInsertUser(ws, msg);
      } else if (msg.trim().startsWith("[Delete_User]")) {
        console.log("Update admin request received");
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
      } else if (msg.trim().startsWith("[Fetch_Archived_Users]")) {
        handleFetchArchivedUsers(ws, msg);
        console.log("Archive user request received");
      } else if (msg.trim().startsWith("[Toggle_User_Status]")) {
        handleToggleUserStatus(ws, msg);
        console.log("Change user status request received");
      } else if (msg.trim().startsWith("[Provide_RFID]")) {
        handleProvideRFID(ws, msg);
        console.log("Provide RFID request received");
      } else if (msg.trim().startsWith("[Provide_NFC]")) {
        handleProvideNFC(ws, msg);
        console.log("Provide NFC request received");
      } else if (msg.trim().startsWith("[Del_Archive]")) {
        handleDeleteArchivedUser(ws, msg);
        console.log("Delete archived user request received");
      } else if (msg.trim().startsWith("[Fetch_Requests]")) {
        handleFetchRequests(ws, msg);
        console.log("Fetch every request recieved");
      } else if (msg.trim().startsWith("[Fetch_Specific_Requests]")) {
        handleFetchSpecificRequest(ws, msg);
        console.log("Fetch every request recieved");
      } else if (msg.trim().startsWith("[Fetch_User_Requests]")) {
        handleFetchUserRequests(ws, msg);
        console.log("Fetch specific request recieved");
      } else if (msg.trim().startsWith("[Resolve_Request]")) {
        handleResolveRequest(ws, msg);
        console.log("Resolve request recieved");
      } else if (msg.trim().startsWith("[Postpone_Request]")) {
        handlePostponeRequest(ws, msg);
        console.log("Postpone request recieved");
      } else if (msg.trim().startsWith("[Gross_Today]")) {
        fetchGrossToday(ws, msg);
        console.log("Gross today request recieved");
      } else if (msg.trim().startsWith("[Gross_Yesterday]")) {
        fetchGrossYesterday(ws, msg);
        console.log("Gross Yesterday request recieved");
      } else if (msg.trim().startsWith("[Fetch_Drivers]")) {
        console.log("Fetching drivers request received");
        handleFetchDrivers(ws, msg);
      } else if (msg.trim().startsWith("[Insert_Driver]")) {
        console.log("Insert drivers request received");
        handleInsertDriver(ws, msg);
      } else if (msg.trim().startsWith("[Delete_Driver")) {
        console.log("Delete drivers request received");
        handleDeleteDriver(ws, msg);
      } else if (msg.trim().startsWith("[Update_Driver]")) {
        console.log("Update drivers request received");
        handleUpdateDriver(ws, msg);
      } else if (data.event === "createPayment") {
        console.log("Striping Time");

        depositToUser(ws, data)
      }else {
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
