import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import startSocket1 from "./Websockets/serverSocket1.js";
import startSocket2 from "./Websockets/serverSocket2.js";

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

async function initializeApp() {
  try {
    console.log("Tables have been created or checked.");

    console.log("Values have been inserted or checked.");

    const server = app.listen(process.env.WS_PORT, () => {
      console.log(`App is listening on port: ${process.env.WS_PORT}`);
    });

    startSocket1();
    startSocket2();

  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
