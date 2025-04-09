import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import startSocket1 from "./Websockets/serverSocket1.js";
import startSocket2 from "./Websockets/serverSocket2.js";
import {
  createModedevTemplatelIfNotExist,
  createModeWalletslIfNotExist,
} from "./Models/templateModel.js";
import {
  createStationModelIfNotExist,
  createRoute1StationIfNotExist,
  createRoute2StationIfNotExist,
} from "./Models/stationModels.js";
import insertUserAndWalletData from "./Services/insertion.js";
import fetchUsers from "./Controllers/fetchAll.js";

dotenv.config();

const app = express();

async function initializeApp() {
  const port = parseInt(process.env.PORT, 10);

  try {
    app.listen(port, () => {
      console.log(
        `${chalk.green("(Express)")} Express app listening on port`,
        port
      );
    });
    startSocket1();
    startSocket2();

    await createModedevTemplatelIfNotExist();
    await createModeWalletslIfNotExist();
    await insertUserAndWalletData();
    await createStationModelIfNotExist();
    await createRoute1StationIfNotExist();
    await createRoute2StationIfNotExist();

    // await fetchUsers();
  } catch (error) {
    console.error(
      `${chalk.red("(Express)")} Error initializing the application:`,
      error
    );
    process.exit(1);
  }
}

initializeApp();
