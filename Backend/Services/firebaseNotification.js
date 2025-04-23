import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { messaging } from "../database.js";
import { logger } from "firebase-functions/v2";

export const sendTransactionNotification = onDocumentCreated(
  "UserTransaction/{userreferencenumber}/{transactionId}",
  async (event) => {
    logger.log("Function triggered at", new Date().toISOString());

    const transactionData = event.data?.data();
    const params = event.params;

    if (!transactionData) {
      logger.error("No transaction data found");
      return;
    }

    try {
      if (!transactionData.amount) {
        logger.warn("Transaction missing amount field");
        return;
      }

      const userRef = params.userreferencenumber || "unknown_user";
      const txType = transactionData.type?.toUpperCase() || "TRANSACTION";
      const amount = parseFloat(transactionData.amount).toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }
      );

      const payload = {
        notification: {
          title: `New ${txType} for ${userRef}`,
          body: `Amount: ${amount}`,
          sound: "default",
        },
      };

      const response = await messaging.sendToTopic("transactions", payload);
      logger.info("Notification sent successfully", { response });
      return null;
    } catch (error) {
      logger.error("Critical error:", error);
      throw error;
    }
  }
);
