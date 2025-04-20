import db from "../../database.js";
import { discountLogger } from "../../Services/logger.js";
import admin from "firebase-admin";

export async function applySeniorDiscounts() {
  try {
    const timestamp = admin.firestore.Timestamp.now();
    const usersRef = db.collection("Users");
    const snapshot = await usersRef.where("age", ">=", 60).get();

    let processedCount = 0;

    for (const doc of snapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      const walletRef = db.doc(`UserWallet/${userId}`);
      const walletDoc = await walletRef.get();

      if (walletDoc.exists) {
        const walletData = walletDoc.data();

        if (walletData.discount !== true) {
          await walletRef.update({
            discount: true,
            discountAppliedAt: timestamp,
          });
          processedCount++;

          discountLogger.info(
            `Senior discount applied for user ${userId} (${userData.age} years old)`
          );
        }
      } else {
        await walletRef.set({
          discount: true,
          discountAppliedAt: timestamp,
          createdAt: timestamp,
        });
        processedCount++;

        discountLogger.info(
          `Created wallet with senior discount for user ${userId} (${userData.age} years old)`
        );
      }
    }

    discountLogger.info(
      `Senior discount check completed. Processed ${processedCount} users.`
    );

    return {
      status: "completed",
      processedCount: processedCount,
      timestamp: timestamp.toDate().toISOString(),
    };
  } catch (error) {
    discountLogger.error("Error in applySeniorDiscounts:", error);
    throw new Error(`Senior discount application failed: ${error.message}`);
  }
}

function startDiscountScanInterval() {
  discountLogger.info("Starting senior discount scanning service...");

  const interval = setInterval(async () => {
    try {
      discountLogger.info("Starting senior discount scan...");
      const result = await applySeniorDiscounts();
      discountLogger.info("Scan completed:", JSON.stringify(result, null, 2));
    } catch (error) {
      discountLogger.error("Scan error:", error);
    }
  }, 10000);

  return interval;
}

const discountInterval = startDiscountScanInterval();

process.on("SIGTERM", () => {
  clearInterval(discountInterval);
  discountLogger.info("Senior discount scanning service stopped");
});

process.on("SIGINT", () => {
  clearInterval(discountInterval);
  discountLogger.info("Senior discount scanning service stopped");
});
