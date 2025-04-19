import db from "../../database.js";
import admin from "firebase-admin";

export async function handleRefundRequests(ws, message) {
  try {
    const cleanedMessage = message.replace("[Request_Refund] ", "");
    const { userId, transactionId } = JSON.parse(cleanedMessage);

    if (!userId || !transactionId) {
      throw new Error("userId and transactionId are required");
    }
    if (!transactionId.startsWith("TX-")) {
      throw new Error("Transaction ID must start with 'TX-'");
    }

    const txSnapshot = await db.collection("UserTransaction").doc(userId).get();

    if (!txSnapshot.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const txData = txSnapshot.data()[transactionId];
    if (!txData) {
      throw new Error(
        `Transaction ${transactionId} not found for user ${userId}`
      );
    }

    const refundDoc = {
      ...txData,
      originalTransactionId: transactionId,
      status: "awaiting",
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
    };

    await db
      .collection("Refunds")
      .doc(userId)
      .collection("Unapproved")
      .doc(transactionId)
      .set(refundDoc);

    ws.send(
      `[Request_Refund_Response] Success: Refund request created for ${transactionId}`
    );
  } catch (error) {
    console.error("Refund request failed:", error);
    ws.send(`[Request_Refund_Response] Error: ${error.message}`);
  }
}
