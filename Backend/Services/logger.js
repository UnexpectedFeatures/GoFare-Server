import winston from "winston";
import path from "path";
import fs from "fs";
import moment from "moment-timezone";

const logDirectory = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

function createLogger(fileName) {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({
        format: () => moment().tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss"),
      }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDirectory, `${fileName}.log`),
      }),
    ],
  });
}

export const trainLogger = createLogger("train-simulator");
export const scanningLogger = createLogger("scanning");
export const stripeLogger = createLogger("stripe");
export const conversionLogger = createLogger("conversion");
export const discountLogger = createLogger("discount");
export const eventLogger = createLogger("event");
export const autoPurgerLogger = createLogger("purger");
export const terminal1Logger = createLogger("terminalA");
export const terminal2Logger = createLogger("terminalB");
export const storageLogger = createLogger("storage");
export const tesseractLogger = createLogger("tesseract");
export const compareLogger = createLogger("compare");
