import db from "../database.js";
import { autoPurgerLogger } from "../Services/logger.js";

export const autoPurger = async () => {
  try {
    const usersSnapshot = await db.collection("Users").get();
    const userIds = new Set(usersSnapshot.docs.map((doc) => doc.id));

    const archiveSnapshot = await db.collection("UserArchive").get();
    archiveSnapshot.docs.forEach((doc) => userIds.add(doc.id));

    const rfidSnapshot = await db.collection("UserRFID").get();
    for (const doc of rfidSnapshot.docs) {
      if (!userIds.has(doc.id)) {
        await db.collection("UserRFID").doc(doc.id).delete();
        autoPurgerLogger.info(`Deleted orphaned UserRFID: ${doc.id}`);
      }
    }

    const walletSnapshot = await db.collection("UserWallet").get();
    for (const doc of walletSnapshot.docs) {
      if (!userIds.has(doc.id)) {
        await db.collection("UserWallet").doc(doc.id).delete();
        autoPurgerLogger.info(`Deleted orphaned UserWallet: ${doc.id}`);
      }
    }

    autoPurgerLogger.info("Orphaned user data cleanup completed successfully.");
  } catch (error) {
    autoPurgerLogger.error(`Error during user data cleanup: ${error.message}`);
  }
};
