import winston from "winston";
import path from "path";
import fs from "fs";

const logDirectory = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

function createLogger(fileName) {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
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
