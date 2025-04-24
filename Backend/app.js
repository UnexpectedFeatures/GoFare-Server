import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import startSocket1 from "./Websockets/serverSocket1.js";
import startSocket2 from "./Websockets/serverSocket2.js";
import startSocket3 from "./Websockets/serverSocket3.js";
import startSocket1b from "./Websockets/serverSocket1b.js";
import { sendTransactionNotification } from "./Services/firebaseNotification.js";
import { syncBalances } from "./Controllers/Stripe/stripeSyncInserter.js";
import { handleDiscountsCounter } from "./Controllers/Events/eventController.js";
import { applySeniorDiscounts } from "./Controllers/Discounts/discountSeniorSync.js";
import runSimulation from "./Services/trainRunner.js";
import paypalRoutes from "./Routes/paypalRoutes.js";
import { convertPHPToUSD } from "./Services/conversion,js";
import { autoPurger } from "./Services/autoPurger.js";
import { startPeriodicDownload } from "./Tesseract/firebaseStorage.js";

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/paypal", paypalRoutes);

const downloadManager = startPeriodicDownload();

async function initializeApp() {
  try {
    console.log("Tables have been created or checked.");
    console.log("Values have been inserted or checked.");

    const server = app.listen(process.env.WS_PORT, () => {
      console.log(`App is listening on port: ${process.env.WS_PORT}`);
    });

    startSocket1();
    startSocket1b();
    startSocket2();
    startSocket3();

    await runSimulation();
    await convertPHPToUSD();
    await applySeniorDiscounts();
    await handleDiscountsCounter();
    await autoPurger();
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
