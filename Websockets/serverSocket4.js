import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import handleRegisterAdmin from "../Controllers/UserLogic/registerController.js";
import fetchAdmins from "../Controllers/UserLogic/fetchAdmin.js";
import handleDelete from "../Controllers/UserLogic/handleDelete.js";
import handleEdit from "../Controllers/UserLogic/handleEdit.js";
import handleSuspend from "../Controllers/UserLogic/handleBanned.js";

dotenv.config();

let socket4Users = null;

function startUserSocket() {
    const port = parseInt(process.env.WS_PORT_3, 10);

    if (isNaN(port)) {
        throw new Error("WS_PORT_3 is not defined or invalid in .env");
    }

    const wss = new WebSocketServer({ port });
    console.log(`WebSocket Server listening on port ${port}`);

    wss.on("connection", (ws) => {
        console.log("Client connected to WS 3003");
        socket4Users = ws;

        console.log("Calling fetchUsers upon connection...");
        fetchUsers(ws, "[FetchUsers]");

        if (socket3User && socket3Admin.readyState === WebSocket.OPEN) {
            console.log("Sending notify message...");
            socket3User.send("[NOTIFY] New client connected to Socket 3");
        }

        ws.on("message", (message) => {
            const msg = message.toString();
            console.log("RAW MESSAGE:", JSON.stringify(msg));

            if (msg.trim().startsWith("[Register]")) {
                console.log("Registering user...");
                handleRegisterAdmin(ws, msg);
            } else if (msg.startsWith("[Delete]")) {
                console.log("Handling delete...");
                handleDelete(ws, msg);
            } else if (msg.startsWith("[Suspend]")) {
                console.log("Suspending user...");
                handleSuspend(ws, msg);
            } else if (msg.startsWith("[Edit]")) {
                console.log("Editing user...");
                handleEdit(ws, msg);
            } else if (msg.startsWith("[FetchUsers]")) {
                console.log("Fetching user upon request...");
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

export default startUserSocket;
