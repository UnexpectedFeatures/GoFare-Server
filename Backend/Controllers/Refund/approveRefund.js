import db from "../../database.js";
import admin from "firebase-admin";

export async function handleApproveRefund(ws, message) {
  try {
    const cleanedMessage = message.replace("[Approve_Refund] ", "");
    const { userId, transactionId } = JSON.parse(cleanedMessage);

    if (!userId || !transactionId) {
      throw new Error("userId and transactionId are required");
    }
    if (!transactionId.startsWith("TX-")) {
      throw new Error("Transaction ID must start with 'TX-'");
    }

    console.log("transaction: ", transactionId);

    const UnapprovedRef = db
      .collection("Refunds")
      .doc(userId)
      .collection("Unapproved")
      .doc(transactionId);

    let amountAddedToWallet = 0;

    await db.runTransaction(async (transaction) => {
      const [UnapprovedDoc, userDoc, walletDoc] = await Promise.all([
        transaction.get(UnapprovedRef),
        transaction.get(db.collection("Users").doc(userId)),
        transaction.get(db.collection("UserWallet").doc(userId)),
      ]);

      if (!UnapprovedDoc.exists) {
        throw new Error(
          `Refund request ${transactionId} not found in Unapproved`
        );
      }

      const refundData = UnapprovedDoc.data();
      const loanedAmount = refundData.loanedAmount || 0;
      const totalAmount = refundData.totalAmount || 0;

      const approvedRefund = {
        ...refundData,
        status: "approved",
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        originalDocumentPath: UnapprovedRef.path,
      };

      const newLoanedAmount = loanedAmount - totalAmount;
      let updatedLoanedAmount = loanedAmount;

      if (newLoanedAmount < 0) {
        amountAddedToWallet = Math.abs(newLoanedAmount);
        updatedLoanedAmount = 0;
      } else {
        updatedLoanedAmount = newLoanedAmount;
      }

      const approvedRef = db
        .collection("Refunds")
        .doc(userId)
        .collection("Approved")
        .doc(transactionId);
      transaction.set(approvedRef, approvedRefund);
      transaction.delete(UnapprovedRef);

      const originalTxRef = db.collection("UserTransaction").doc(userId);
      transaction.update(originalTxRef, {
        [`${transactionId}.status`]: "refund_approved",
      });

      transaction.update(db.collection("Users").doc(userId), {
        loanedAmount: updatedLoanedAmount,
      });

      const currentBalance = walletDoc.exists
        ? walletDoc.data().balance || 0
        : 0;
      transaction.set(
        db.collection("UserWallet").doc(userId),
        {
          balance: currentBalance + amountAddedToWallet,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    ws.send(
      `[Approve_Refund_Response] Success: Refund ${transactionId} approved. $${amountAddedToWallet} added to wallet.`
    );
  } catch (error) {
    console.error("Approve refund failed:", error);
    ws.send(`[Approve_Refund_Response] Error: ${error.message}`);
  }
}
