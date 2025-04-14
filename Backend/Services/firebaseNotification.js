import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { messaging } from "../database.js";

export const sendTransactionNotification = onDocumentCreated(
  "Usertransactions/{userreferencenumber}/transactions/{transactionId}",
  async (event) => {
    const transactionData = event.data?.data();

    if (!transactionData) {
      console.log("No data associated with the transaction");
      return;
    }

    try {
      const payload = {
        notification: {
          title: "New Transaction Alert",
          body: `New transaction added: ${transactionData.amount}`,
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
