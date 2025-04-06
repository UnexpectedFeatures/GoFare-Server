import express from "express";
import dotenv from "dotenv";
import startSocket1 from "./Websockets/serverSocket1.js";
import startSocket2 from "./Websockets/serverSocket2.js";
import fetchUsers from "./Controllers/fetchAll.js";

dotenv.config();

const app = express();

async function initializeApp() {
  try {
    app.listen(process.env.PORT, () => {
      console.log(`Express app listening on port ${process.env.PORT}`);
    });
    startSocket1();
    startSocket2();

    await fetchUsers();
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
