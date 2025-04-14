import { onValueCreated } from "firebase-functions/v2/database";
import { messaging } from "../database.js";

export const sendTransactionNotification = onValueCreated(
  "/Transactions/{rfid}/{transactionId}",
  async (event) => {
    const transaction = event.data.val();

    try {
      const payload = {
        notification: {
          title: "New Transaction Alert",
          body: `New transaction added: ${transaction.amount}`,
          sound: "default",
        },
      };

      const response = await messaging.sendToTopic("transactions", payload);
      console.log("Notification sent successfully:", response);
      return null;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }
);
