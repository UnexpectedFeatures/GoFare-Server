import express from "express";
import dotenv from "dotenv";
import startSocket1 from "./Websockets/serverSocket1.js";
import startSocket2 from "./Websockets/serverSocket2.js";
import fetchUsers from "./Controllers/fetchAll.js";

dotenv.config();

const app = express();

async function initializeApp() {
  const port = parseInt(process.env.PORT, 10);

  try {
    app.listen(port, () => {
      console.log(`(Express) Express app listening on port`, port);
    });
    startSocket1();
    startSocket2();

    await fetchUsers();
  } catch (error) {
    console.error("(Express) Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
