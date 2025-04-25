import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
dotenv.config();

import { handleFetchTransactions } from "../Controllers/fetchTransactions.js";
import { handleFetchTrainDetails } from "../Controllers/VehicleLocation/fetchVehicleLocation.js"
import { handleLoginAdmin } from "../Controllers/Admins/loginAdmin.js";
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


import { handleExpiredUser } from "../Controllers/Users/deleteExpiredUser.js";
import { handleSuspendUser } from "../Controllers/Users/suspendUser.js";
import { handleFetchUsers } from "../Controllers/Users/fetchUsers.js";
import { handleFetchAllUserData } from "../Controllers/Users/fetchEverything.js";
import { handleInsertUser } from "../Controllers/Users/insertUsers.js";
import { handleDeleteUser } from "../Controllers/Users/deleteUser.js";
import { handleUpdateUser } from "../Controllers/Users/updateUser.js";
import { handleFetchArchiveUsers } from "../Controllers/Users/fetchArchive.js";
import { handleDeleteArchivedUser } from "../Controllers/Users/deleteArchive.js";
import { handleToggleUserStatus } from "../Controllers/Users/changeStatusUser.js";
import { handleRetrieveUser } from "../Controllers/Users/retrieveUser.js";

import { handleFetchUserRequests } from "../Controllers/Requests/fetchUserRequests.js";
import { handleFetchRequests } from "../Controllers/Requests/fetchEverythingRequest.js";
import { handleFetchSpecificRequest } from "../Controllers/Requests/fetchSpecificRequest.js";
import { handleResolveRequest } from "../Controllers/Requests/resolveRequest.js";
import { handlePostponeRequest } from "../Controllers/Requests/postponeRequest.js";

import { handleFetchRefundRequests } from "../Controllers/Refund/fetchRefundRequests.js";
import { handleApproveRefund } from "../Controllers/Refund/approveRefund.js";
import { handleRejectRefund } from "../Controllers/Refund/rejectRefund.js";
import { handleRefundRequests } from "../Controllers/Refund/requestRefund.js";
import { handleFetchRejectedRefunds } from "../Controllers/Refund/fetchRefundRejected.js";
import { handleFetchApprovedRefunds } from "../Controllers/Refund/fetchRefundApproved.js";

import { handleDeactivateRFID } from "../Controllers/RFID-NFC/deactivateRFID.js";
import { handleActivateRFID } from "../Controllers/RFID-NFC/activateRFID.js";
import { handleDeactivateNFC } from "../Controllers/RFID-NFC/deactivateNFC.js";
import { handleActivateNFC } from "../Controllers/RFID-NFC/activateNFC.js";
import { handleProvideRFID } from "../Controllers/RFID-NFC/provideRFID.js";
import { handleProvideNFC } from "../Controllers/RFID-NFC/provideNFC.js";

import { fetchGrossYesterday } from "../Controllers/Stripe/grossVolumeYesterday.js";
import { fetchGrossToday } from "../Controllers/Stripe/grossVolumeToday.js";
import { depositToUser } from "../Services/stripe.js";

let socket3Admin = null;

function startSocket3() {
  const port = parseInt(process.env.WS_PORT_3, 10);
  const wss = new WebSocketServer({ port });

  wss.on("connection", (ws) => {
    console.log(`(Socket 3) New client connected on port ${port}`);
    socket3Admin = ws;

    if (ws.readyState === WebSocket.OPEN) {
      ws.send("[NOTIFY] New client connected to Socket 3");
    }

    ws.on("message", (message) => {
      const msg = message.toString();
      let data = null;

      try {
        data = JSON.parse(msg);
      } catch (err) {
        // Message is not JSON, that's okay
      }

      console.log("RAW MESSAGE:", msg);
      
      // Match bracket-style commands
      if (msg.startsWith("[Fetch_Users]")) handleFetchUsers(ws, msg);
      else if (msg.startsWith("[Fetch_Transactions]")) handleFetchTransactions(ws, msg);
      else if (msg.startsWith("[Fetch_All]")) handleFetchAllUserData(ws, msg);
      else if (msg.startsWith("[Fetch_Admins]")) handleFetchAdmins(ws, msg);
      else if (msg.startsWith("[Login_Admin]")) handleLoginAdmin(ws, msg);
      else if (msg.startsWith("[Fetch_Admins_Archive]")) handleFetchArchiveAdmins(ws, msg);
      else if (msg.startsWith("[Insert_Admin]")) handleInsertAdmin(ws, msg);
      else if (msg.startsWith("[Suspend_Admin]")) handleSuspendAdmin(ws, msg);
      else if (msg.startsWith("[Delete_Admin]")) handleDeleteAdmin(ws, msg);
      else if (msg.startsWith("[Delete_Expired_Admins]")) handleExpiredAdmin(ws, msg);
      else if (msg.startsWith("[Update_Admin]")) handleUpdateAdmin(ws, msg);
      else if (msg.startsWith("[Retrieve_Admin]")) handleRetrieveAdmin(ws, msg);
      else if (msg.startsWith("[Fetch_Target_Admin]")) handleFetchTargetAdmin(ws, msg);

      else if (msg.startsWith("[Fetch_Target_Driver]")) handleFetchTargetDriver(ws, msg);
      else if (msg.startsWith("[Fetch_Drivers]")) handleFetchDrivers(ws, msg);
      else if (msg.startsWith("[Fetch_Drivers_Archive]")) handleFetchArchiveDrivers(ws, msg);
      else if (msg.startsWith("[Insert_Driver]")) handleInsertDriver(ws, msg);
      else if (msg.startsWith("[Suspend_Driver]")) handleSuspendDriver(ws, msg);
      else if (msg.startsWith("[Delete_Driver]")) handleDeleteDriver(ws, msg);
      else if (msg.startsWith("[Delete_Expired_Drivers]")) handleExpiredDriver(ws, msg);
      else if (msg.startsWith("[Update_Driver]")) handleUpdateDriver(ws, msg);
      else if (msg.startsWith("[Retrieve_Driver]")) handleRetrieveDriver(ws, msg);

      else if (msg.startsWith("[Insert_User]")) handleInsertUser(ws, msg);
      else if (msg.startsWith("[Delete_User]")) handleDeleteUser(ws, msg);
      else if (msg.startsWith("[Update_User]")) handleUpdateUser(ws, msg);
      else if (msg.startsWith("[Suspend_User]")) handleSuspendUser(ws, msg);
      else if (msg.startsWith("[Retrieve_User]")) handleRetrieveUser(ws, msg);
      else if (msg.startsWith("[Delete_Expired_Users]")) handleExpiredUser(ws, msg);

      else if (msg.startsWith("[Fetch_Refunds_Unapproved]")) handleFetchRefundRequests(ws, msg);
      else if (msg.startsWith("[Fetch_Refunds_Approved]")) handleFetchApprovedRefunds(ws, msg);
      else if (msg.startsWith("[Fetch_Refunds_Rejected]")) handleFetchRejectedRefunds(ws, msg);
      else if (msg.startsWith("[Approve_Refund]")) handleApproveRefund(ws, msg);
      else if (msg.startsWith("[Reject_Refund]")) handleRejectRefund(ws, msg);
      else if (msg.startsWith("[Request_Refund]")) handleRefundRequests(ws, msg);

      else if (msg.startsWith("[Deactivate_RFID]")) handleDeactivateRFID(ws, msg);
      else if (msg.startsWith("[Activate_RFID]")) handleActivateRFID(ws, msg);
      else if (msg.startsWith("[Deactivate_NFC]")) handleDeactivateNFC(ws, msg);
      else if (msg.startsWith("[Activate_NFC]")) handleActivateNFC(ws, msg);

      else if (msg.startsWith("[Fetch_Archived_Users]")) handleFetchArchiveUsers(ws, msg);
      else if (msg.startsWith("[Toggle_User_Status]")) handleToggleUserStatus(ws, msg);
      else if (msg.startsWith("[Provide_RFID]")) handleProvideRFID(ws, msg);
      else if (msg.startsWith("[Provide_NFC]")) handleProvideNFC(ws, msg);
      else if (msg.startsWith("[Del_Archive]")) handleDeleteArchivedUser(ws, msg);

      else if (msg.startsWith("[Fetch_Requests]")) handleFetchRequests(ws, msg);
      else if (msg.startsWith("[Fetch_Specific_Requests]")) handleFetchSpecificRequest(ws, msg);
      else if (msg.startsWith("[Fetch_User_Requests]")) handleFetchUserRequests(ws, msg);
      else if (msg.startsWith("[Resolve_Request]")) handleResolveRequest(ws, msg);
      else if (msg.startsWith("[Postpone_Request]")) handlePostponeRequest(ws, msg);

      else if (msg.startsWith("[Gross_Today]")) fetchGrossToday(ws, msg);
      else if (msg.startsWith("[Gross_Yesterday]")) fetchGrossYesterday(ws, msg);
      else if (msg.startsWith("[Vehicle_Location]")) handleFetchTrainDetails(ws, msg);
      
      // Handle Stripe events (JSON-based)
      else if (data?.event === "createPayment") {
        console.log("Stripe createPayment request received");
        depositToUser(ws, data);
      }

      else {
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

  console.log(`(Socket 3) WebSocket server started on port ${port}`);
}

// Run expired cleanup every 2 minutes
setInterval(() => {
  console.log("🧪 TESTING: Running expired admin, driver cleanup...");
  handleExpiredAdmin();
  handleExpiredDriver();
}, 60 * 2000);

setInterval(() => {
  console.log("🧪 TESTING: Running vehicle location...");
  handleFetchTrainDetails();
}, 5 * 1000);

export default startSocket3;
