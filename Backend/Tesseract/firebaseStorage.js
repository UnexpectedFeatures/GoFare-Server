import { bucket } from "../database.js";
import { writeFile, mkdir, access, constants } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { storageLogger } from "../Services/logger.js";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".tiff",
  ".bmp",
  ".svg",
]);

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isImageFile(fileName) {
  const lowerFileName = fileName.toLowerCase();
  return [...IMAGE_EXTENSIONS].some((ext) => lowerFileName.endsWith(ext));
}

async function convertToGrayscale(inputBuffer) {
  try {
    return await sharp(inputBuffer).grayscale().toBuffer();
  } catch (error) {
    storageLogger.error("Image conversion error:", error);
    throw error;
  }
}

async function downloadAllUserFiles(
  userId,
  folderType = "studentIds",
  localFolderPath = `${folderType}/${userId}`
) {
  try {
    storageLogger.debug(
      `Starting download for user ${userId} in ${folderType}`
    );

    const [files] = await bucket.getFiles({ prefix: localFolderPath });

    if (files.length === 0) {
      storageLogger.info(`No files found for user ${userId} in ${folderType}`);
      return [];
    }

    const userDir = join(__dirname, folderType, userId);
    await mkdir(userDir, { recursive: true });

    const downloadedFiles = [];
    const stats = {
      total: files.length,
      images: 0,
      converted: 0,
      skipped: 0,
      errors: 0,
    };

    for (const file of files) {
      const fileName = file.name.split("/").pop();
      const destinationPath = join(userDir, fileName);

      if (await fileExists(destinationPath)) {
        storageLogger.debug(`Skipping existing file: ${fileName}`);
        downloadedFiles.push(destinationPath);
        stats.skipped++;
        continue;
      }

      try {
        const [fileData] = await file.download();
        let finalData = fileData;

        if (isImageFile(fileName)) {
          stats.images++;
          try {
            finalData = await convertToGrayscale(fileData);
            stats.converted++;
            storageLogger.debug(`Converted to grayscale: ${fileName}`);
          } catch (error) {
            storageLogger.warn(
              `Using original image (conversion failed for ${fileName}): ${error.message}`
            );
          }
        }

        await writeFile(destinationPath, finalData);
        downloadedFiles.push(destinationPath);
        storageLogger.info(`Downloaded: ${fileName}`);
      } catch (error) {
        stats.errors++;
        storageLogger.error(`Error processing ${fileName}:`, {
          error: error.message,
        });
      }
    }

    storageLogger.info(`Download completed for user ${userId}`, {
      stats,
      folderType,
      userId,
    });

    return downloadedFiles;
  } catch (error) {
    storageLogger.error(`Download failed for user ${userId}:`, {
      error: error.message,
      folderType,
    });
    throw error;
  }
}

async function downloadAllUsersFiles(folderType = "studentIds") {
  try {
    storageLogger.info(`Starting batch download for ${folderType}`);

    const [allFiles] = await bucket.getFiles({ prefix: `${folderType}/` });

    const filesByUser = allFiles.reduce((acc, file) => {
      const parts = file.name.split("/");
      if (parts.length >= 3) {
        const userId = parts[1];
        acc[userId] = acc[userId] || [];
        acc[userId].push(file);
      }
      return acc;
    }, {});

    const userIds = Object.keys(filesByUser);
    if (userIds.length === 0) {
      storageLogger.info(`No users found in ${folderType}`);
      return;
    }

    storageLogger.debug(`Processing ${userIds.length} users in ${folderType}`);

    for (const userId of userIds) {
      await downloadAllUserFiles(userId, folderType);
    }

    storageLogger.info(`Completed batch download for ${folderType}`, {
      totalUsers: userIds.length,
    });
  } catch (error) {
    storageLogger.error(`Batch download failed for ${folderType}:`, {
      error: error.message,
    });
    throw error;
  }
}

async function runDownload() {
  const startTime = Date.now();
  try {
    storageLogger.info("Starting full download cycle");

    await downloadAllUsersFiles("studentIds");
    await downloadAllUsersFiles("validIds");

    const duration = (Date.now() - startTime) / 1000;
    storageLogger.info("Download cycle completed", {
      duration: `${duration.toFixed(2)}s`,
    });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    storageLogger.error("Download cycle failed", {
      error: error.message,
      duration: `${duration.toFixed(2)}s`,
    });
    throw error;
  }
}

function startPeriodicDownload(intervalSeconds = 60 * 5) {
  const intervalMs = intervalSeconds * 1000;
  let timeoutId;
  let isRunning = false;

  async function periodicRunner() {
    if (isRunning) {
      storageLogger.debug(
        "Previous download still running - skipping this cycle"
      );
      scheduleNext();
      return;
    }

    try {
      isRunning = true;
      await runDownload();
    } catch (error) {
    } finally {
      isRunning = false;
      scheduleNext();
    }
  }

  function scheduleNext() {
    timeoutId = setTimeout(periodicRunner, intervalMs);
    storageLogger.debug(
      `Next download scheduled in ${intervalSeconds} seconds`
    );
  }

  periodicRunner();

  return {
    stop: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        storageLogger.info("Periodic downloads stopped");
      }
    },
    getStatus: () => ({
      isRunning,
      nextRun: timeoutId ? new Date(Date.now() + intervalMs) : null,
      intervalSeconds,
    }),
  };
}

export {
  downloadAllUserFiles,
  downloadAllUsersFiles,
  startPeriodicDownload,
  runDownload,
  fileExists,
};
