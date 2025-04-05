import express from "express";
import dotenv from "dotenv";
import startServerWebsocket from "./Websockets/serverSocket.js";
import fetchUsers from "./Controllers/fetchAll.js";

dotenv.config();

const app = express();

async function initializeApp() {
  try {
    const server = app.listen(process.env.WS_PORT, () => {
      console.log(`App is listening on port: ${process.env.WS_PORT}`);
    });
    await fetchUsers();

    startServerWebsocket(server);
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
