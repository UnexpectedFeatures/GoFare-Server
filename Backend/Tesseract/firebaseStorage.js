import { bucket } from "../database.js";
import { writeFile, mkdir, access, constants } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { storageLogger } from "../Services/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadAllUserFiles(
  userId,
  folderType = "studentIds",
  localFolderPath = `${folderType}/${userId}`
) {
  try {
    const [files] = await bucket.getFiles({ prefix: localFolderPath });

    if (files.length === 0) {
      storageLogger.info(`No files found for user ${userId} in ${folderType}`);
      return [];
    }

    const userDir = join(__dirname, folderType, userId);
    await mkdir(userDir, { recursive: true });

    const downloadedFiles = [];

    for (const file of files) {
      const fileName = file.name.split("/").pop();
      const destinationPath = join(userDir, fileName);

      if (await fileExists(destinationPath)) {
        storageLogger.debug(`Skipping existing file: ${fileName}`);
        downloadedFiles.push(destinationPath);
        continue;
      }

      try {
        const [data] = await file.download();
        await writeFile(destinationPath, data);
        downloadedFiles.push(destinationPath);
        storageLogger.info(`Downloaded: ${fileName} from ${folderType}`);
      } catch (error) {
        storageLogger.error(`Error downloading ${fileName}: ${error.message}`, {
          error,
        });
      }
    }

    storageLogger.info(
      `Processed ${downloadedFiles.length} files for user ${userId} from ${folderType}`
    );
    return downloadedFiles;
  } catch (error) {
    storageLogger.error(`Error in downloadAllUserFiles for ${folderType}:`, {
      error,
    });
    throw error;
  }
}

async function downloadAllUsersFiles(folderType = "studentIds") {
  try {
    const [allFiles] = await bucket.getFiles({ prefix: `${folderType}/` });

    const filesByUser = {};
    for (const file of allFiles) {
      const parts = file.name.split("/");
      if (parts.length < 3) continue;
      const userId = parts[1];
      if (!filesByUser[userId]) filesByUser[userId] = [];
      filesByUser[userId].push(file);
    }

    for (const userId in filesByUser) {
      await downloadAllUserFiles(userId, folderType);
    }
  } catch (error) {
    storageLogger.error(`Error in downloadAllUsersFiles for ${folderType}:`, {
      error,
    });
    throw error;
  }
}

async function runDownload() {
  try {
    storageLogger.debug("Starting manual download of user files");
    await downloadAllUsersFiles("studentIds");
    await downloadAllUsersFiles("validIds");
    storageLogger.debug("Completed manual download of user files");
  } catch (error) {
    storageLogger.error("Error during manual download:", { error });
    throw error;
  }
}

function startPeriodicDownload(intervalSeconds = 10) {
  const intervalMs = intervalSeconds * 1000;
  let timeoutId;

  function periodicRunner() {
    runDownload().finally(() => {
      timeoutId = setTimeout(periodicRunner, intervalMs);
    });
  }

  periodicRunner();

  return {
    stop: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        storageLogger.info("Stopped periodic file downloads");
      }
    },
  };
}

export {
  downloadAllUserFiles,
  downloadAllUsersFiles,
  startPeriodicDownload,
  runDownload,
  fileExists,
};
