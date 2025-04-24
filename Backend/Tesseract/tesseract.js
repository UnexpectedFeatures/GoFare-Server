import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";
import { tesseractLogger } from "../Services/logger.js";

const SCAN_INTERVAL_MS = 5000;
const ID_FOLDERS = {
  valid: "Tesseract/validIds",
  student: "Tesseract/studentIds",
};

const processedFiles = new Set();
let isProcessing = false;

const performOCR = async (imagePath) => {
  const worker = await createWorker();
  try {
    const {
      data: { text },
    } = await worker.recognize(imagePath, "eng");
    return text.trim();
  } catch (error) {
    tesseractLogger.error(`OCR failed for ${imagePath}: ${error.message}`);
    throw error;
  } finally {
    await worker.terminate();
  }
};

const processImageFile = async (filePath, userId) => {
  try {
    const text = await performOCR(filePath);
    const txtFilePath = path.join(path.dirname(filePath), `${userId}.txt`);

    fs.writeFileSync(txtFilePath, text, "utf-8");
    tesseractLogger.info(
      `Successfully processed ${filePath} for user ${userId}`
    );

    return true;
  } catch (error) {
    tesseractLogger.error(`Error processing ${filePath}: ${error.message}`);
    return false;
  }
};

const scanFolder = async (folderPath) => {
  try {
    tesseractLogger.debug(`Scanning folder: ${folderPath}`);
    const items = fs.readdirSync(folderPath, { withFileTypes: true });

    let filesFound = false;
    for (const item of items) {
      if (item.isDirectory()) {
        const userId = item.name;
        const userFolderPath = path.join(folderPath, userId);

        try {
          const userFiles = fs.readdirSync(userFolderPath);

          for (const file of userFiles) {
            const filePath = path.join(userFolderPath, file);
            const fileKey = `${folderPath}/${userId}/${file}`;

            if (
              (file.toLowerCase().endsWith(".png") ||
                file.toLowerCase().endsWith(".jpg")) &&
              !processedFiles.has(fileKey)
            ) {
              filesFound = true;
              tesseractLogger.debug(`Processing file: ${filePath}`);
              const success = await processImageFile(filePath, userId);
              if (success) {
                processedFiles.add(fileKey);
              }
            }
          }
        } catch (error) {
          tesseractLogger.error(
            `Error reading user folder ${userFolderPath}: ${error.message}`
          );
        }
      }
    }

    if (!filesFound) {
      tesseractLogger.debug(`No new files found in ${folderPath}`);
    }
  } catch (error) {
    tesseractLogger.error(
      `Error scanning folder ${folderPath}: ${error.message}`
    );
  }
};

const startOCRProcessing = () => {
  tesseractLogger.info("Starting OCR processing service");

  const intervalHandler = async () => {
    if (isProcessing) {
      tesseractLogger.debug(
        "Previous scan still in progress, skipping this interval"
      );
      return;
    }

    try {
      isProcessing = true;
      tesseractLogger.debug(`Starting scan at ${new Date().toISOString()}`);

      await scanFolder(ID_FOLDERS.valid);
      await scanFolder(ID_FOLDERS.student);

      tesseractLogger.debug(`Completed scan at ${new Date().toISOString()}`);
    } catch (error) {
      tesseractLogger.error(`Fatal error during scanning: ${error.message}`);
    } finally {
      isProcessing = false;
    }
  };

  intervalHandler();

  const intervalId = setInterval(intervalHandler, SCAN_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    tesseractLogger.info("Stopped OCR processing service");
  };
};

let ocrCleanup = null;

export const initializeOCR = () => {
  if (!ocrCleanup) {
    ocrCleanup = startOCRProcessing();
    tesseractLogger.info("OCR service initialized");
  } else {
    tesseractLogger.warn("OCR service already initialized");
  }
  return ocrCleanup;
};

export const shutdownOCR = () => {
  if (ocrCleanup) {
    ocrCleanup();
    ocrCleanup = null;
    tesseractLogger.info("OCR service shut down");
  }
};
