import { bucket } from "../database.js";
import { writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function downloadAllUserFiles(
  userId,
  folderPath = `studentIds/${userId}`
) {
  try {
    const [files] = await bucket.getFiles({ prefix: folderPath });

    if (files.length === 0) {
      console.log(`No files found for user ${userId}`);
      return [];
    }

    const userDir = join(__dirname, "Images", userId);
    await mkdir(userDir, { recursive: true });

    const downloadedFiles = [];

    for (const file of files) {
      const fileName = file.name.split("/").pop();
      const destinationPath = join(userDir, fileName);

      try {
        const [data] = await file.download();
        await writeFile(destinationPath, data);
        downloadedFiles.push(destinationPath);
        console.log(`Downloaded: ${fileName}`);
      } catch (error) {
        console.error(`Error downloading ${fileName}:`, error);
      }
    }

    console.log(
      `Downloaded ${downloadedFiles.length} files for user ${userId}`
    );
    return downloadedFiles;
  } catch (error) {
    console.error("Error in downloadAllUserFiles:", error);
    throw error;
  }
}

async function downloadAllUsersFiles() {
  const [allFiles] = await bucket.getFiles({ prefix: "studentIds/" });

  const filesByUser = {};
  for (const file of allFiles) {
    const parts = file.name.split("/");
    if (parts.length < 3) continue;
    const userId = parts[1];
    if (!filesByUser[userId]) filesByUser[userId] = [];
    filesByUser[userId].push(file);
  }

  for (const userId in filesByUser) {
    await downloadAllUserFiles(userId);
  }
}

await downloadAllUsersFiles();
