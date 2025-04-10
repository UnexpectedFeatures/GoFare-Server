import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import createDatabaseIfNotExists from "./Services/databaseCreate.js";
import db from "./database.js";
import {
  createTableUserAccounts,
  createTableSignInAccounts,
  createTableUserUnhasedAccounts,
  createTableUserBanned,
  createTableWallet,
  createTablePassenger,
  createTableTransaction,
  createTableTrainRoute,
  createTableTrainCurrent,
} from "./Services/tableCreate.js";
import {
  syncAllFirebaseUsersToSequelize,
  syncAllTrainRoutes,
  syncCurrentLocationFromFirebase,
} from "./Services/firebaseSync.js";
import startSocket1 from "./Websockets/serverSocket1.js";
import startSocket2 from "./Websockets/serverSocket2.js";

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

async function initializeApp() {
  try {
    await createDatabaseIfNotExists();
    await db.authenticate();

    await createTableUserAccounts();
    await createTableSignInAccounts();
    await createTableUserUnhasedAccounts();
    await createTableUserBanned();
    await createTableWallet();
    await createTableTrainRoute();
    await createTablePassenger();
    await createTableTransaction();
    await createTableTrainCurrent();

    console.log("Tables have been created or checked.");

    console.log("Values have been inserted or checked.");

    startSocket1();
    startSocket2();

    const server = app.listen(process.env.WS_PORT, () => {
      console.log(`App is listening on port: ${process.env.WS_PORT}`);
    });
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
