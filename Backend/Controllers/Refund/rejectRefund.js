import db from "../../database.js";
import admin from "firebase-admin";

export async function handleRejectRefund(ws, message) {
  try {
    const cleanedMessage = message.replace("[Reject_Refund] ", "");
    const { userId, transactionId, reason } = JSON.parse(cleanedMessage);

    if (!userId || !transactionId) {
      throw new Error("userId and transactionId are required");
    }
    if (!transactionId.startsWith("TX-")) {
      throw new Error("Transaction ID must start with 'TX-'");
    }

    const UnapprovedRef = db
      .collection("Refunds")
      .doc(userId)
      .collection("Unapproved")
      .doc(transactionId);

    const UnapprovedDoc = await UnapprovedRef.get();

    if (!UnapprovedDoc.exists) {
      throw new Error(
        `Refund request ${transactionId} not found in Unapproved`
      );
    }

    const rejectedRefund = {
      ...UnapprovedDoc.data(),
      status: "rejected",
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason: reason || "No reason provided",
      originalDocumentPath: UnapprovedRef.path,
    };

    await db.runTransaction(async (transaction) => {
      const rejectedRef = db
        .collection("Refunds")
        .doc(userId)
        .collection("Rejected")
        .doc(transactionId);

      transaction.set(rejectedRef, rejectedRefund);

      transaction.delete(UnapprovedRef);

      const originalTxRef = db.collection("UserTransaction").doc(userId);

      transaction.update(originalTxRef, {
        [`${transactionId}.status`]: "refund_rejected",
      });
    });

    ws.send(
      `[Reject_Refund_Response] Success: Refund ${transactionId} rejected`
    );
  } catch (error) {
    console.error("Reject refund failed:", error);
    ws.send(`[Reject_Refund_Response] Error: ${error.message}`);
  }
}
