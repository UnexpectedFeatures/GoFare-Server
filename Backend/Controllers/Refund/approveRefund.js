import db from "../../database.js";
import admin from "firebase-admin";
import transporter from "../../Services/mailSender.js";

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
    let userData = null;

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

      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }

      userData = userDoc.data();

      if (!userData.email) {
        throw new Error(`Email not found for user ${userId}`);
      }

      if (!userData.firstName || !userData.lastName) {
        throw new Error(`First name or last name not found for user ${userId}`);
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

    const formattedName = `${
      userData.firstName.charAt(0).toUpperCase() +
      userData.firstName.slice(1).toLowerCase()
    } ${
      userData.lastName.charAt(0).toUpperCase() +
      userData.lastName.slice(1).toLowerCase()
    }`;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: userData.email,
      subject: `Refund Approval Notice`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #28a745; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #28a745; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Refund Approved</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">USER</div>
                <div style="font-weight: bold; font-size: 18px;">${formattedName}</div>
              </div>
            </div>
            
            <div style="background-color: #f5f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="text-align: center; color: #333;">
                <p style="margin: 0 0 15px 0;">Your refund request has been approved</p>
                <div style="font-size: 24px; color: #28a745; font-weight: bold;">
                  AMOUNT: $${amountAddedToWallet.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">APPROVAL DATE</div>
                <div style="font-weight: bold;">${new Date().toLocaleDateString(
                  "en-GB"
                )}</div>
              </div>
              <div style="flex: 1; text-align: right;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">TIME</div>
                <div style="font-weight: bold;">${new Date().toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}</div>
              </div>
            </div>
            
            <div style="border-top: 2px dashed #ccc; padding-top: 15px; text-align: center; color: #666; font-size: 14px;">
              <p>If you have any issues or questions, please contact our support team.</p>
            </div>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: black; border-top: 1px solid #ddd;">
            <div>Issued on ${new Date()
              .toLocaleString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toUpperCase()}</div>
            <div style="margin-top: 10px; color: #28a745; font-weight: bold;">Thank you for using our service</div>
          </div>
        </div>
        
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto 0; font-size: 12px; color: black; line-height: 1.5;">
          <p>This is an automated notification - please do not reply directly to this message.</p>
          <p>For assistance, visit our support portal or call +63 123 456 7890.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    ws.send(
      `[Approve_Refund_Response] Success: Refund ${transactionId} approved. $${amountAddedToWallet} added to wallet. Email notification sent to ${userData.email}.`
    );
  } catch (error) {
    console.error("Approve refund failed:", error);
    ws.send(`[Approve_Refund_Response] Error: ${error.message}`);
  }
}
