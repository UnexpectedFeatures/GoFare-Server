import fs from "fs/promises";
import path from "path";
import { compareLogger } from "../Services/logger.js";
import { setInterval } from "timers/promises";

async function readNestedTextFiles(baseDir = "./") {
  try {
    const directories = ["studentIds", "validIds"];
    const absoluteBaseDir = path.resolve(baseDir);
    compareLogger.info(`\n🔍 Scanning directory: ${absoluteBaseDir}`);

    for (const dir of directories) {
      const fullPath = path.join(absoluteBaseDir, dir);

      try {
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        compareLogger.info(`\n📂 Processing ${dir} directory:`);

        for (const item of items) {
          if (item.isDirectory()) {
            const subDirPath = path.join(fullPath, item.name);
            const txtFile = path.join(subDirPath, `${item.name}.txt`);

            try {
              const content = await fs.readFile(txtFile, "utf8");

              compareLogger.info(`\n══════════════════════════════════════`);
              compareLogger.info(`FILE: ${path.basename(txtFile)}`);
              compareLogger.info(`LOCATION: ${txtFile}`);
              compareLogger.info(
                `🕒 LAST MODIFIED: ${(await fs.stat(txtFile)).mtime}`
              );
              compareLogger.info(`\nCONTENT:\n${"─".repeat(40)}`);
              compareLogger.info(content);
              compareLogger.info(`${"─".repeat(40)}`);
              compareLogger.info(`SIZE: ${content.length} characters`);
              compareLogger.info(`══════════════════════════════════════\n`);
            } catch (readError) {
              if (readError.code === "ENOENT") {
                compareLogger.warn(`Expected file not found: ${txtFile}`);
              } else {
                compareLogger.error(
                  `❌ Error reading file: ${readError.message}`,
                  {
                    path: txtFile,
                    stack: readError.stack,
                  }
                );
              }
            }
          }
        }
      } catch (dirError) {
        if (dirError.code === "ENOENT") {
          compareLogger.warn(`Directory missing: ${fullPath}`);
        } else {
          compareLogger.error(`Directory error: ${dirError.message}`, {
            path: fullPath,
            stack: dirError.stack,
          });
        }
      }
    }
  } catch (error) {
    compareLogger.error(`Critical error during scan: ${error.message}`, {
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function startFileMonitor(
  baseDir = "./Tesseract",
  interval = 10000
) {
  compareLogger.info(`\n🚀 Starting file monitor service`, {
    baseDir: path.resolve(baseDir),
    interval,
    startedAt: new Date().toISOString(),
  });

  try {
    await readNestedTextFiles(baseDir);

    for await (const _ of setInterval(interval)) {
      compareLogger.info(
        `\n Running scheduled scan (${new Date().toLocaleTimeString()})`
      );
      await readNestedTextFiles(baseDir);
    }
  } catch (error) {
    compareLogger.error(` Monitor service crashed: ${error.message}`, {
      error: error.stack,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
