import db from "../../database.js";
import admin from "firebase-admin";
import transporter from "../../Services/mailSender.js";

export async function handleRejectRefund(ws, message) {
  try {
    console.log("Raw message received:", message);

    const cleanedMessage = message.replace("[Reject_Refund] ", "");
    const { userId, transactionId, reason } = JSON.parse(cleanedMessage);

    console.log("Parsed Data:", { userId, transactionId, reason });

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

    let userData = null;

    await db.runTransaction(async (transaction) => {
      console.log("Starting transaction for rejection...");

      const [UnapprovedDoc, userDoc] = await Promise.all([
        transaction.get(UnapprovedRef),
        transaction.get(db.collection("Users").doc(userId)),
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

      const rejectedRefund = {
        ...UnapprovedDoc.data(),
        status: "rejected",
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: reason || "No reason provided",
        originalDocumentPath: UnapprovedRef.path,
      };

      const rejectedRef = db
        .collection("Refunds")
        .doc(userId)
        .collection("Rejected")
        .doc(transactionId);

      transaction.set(rejectedRef, rejectedRefund);
      console.log("Set rejected refund doc.");

      transaction.delete(UnapprovedRef);
      console.log("Deleted unapproved refund doc.");

      const originalTxRef = db.collection("UserTransaction").doc(userId);
      transaction.update(originalTxRef, {
        [`${transactionId}.status`]: "refund_rejected",
      });
      console.log("Updated original transaction status.");
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
      subject: `Refund Rejection Notice`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #dc3545; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #dc3545; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Refund Rejected</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">USER</div>
                <div style="font-weight: bold; font-size: 18px;">${formattedName}</div>
              </div>
            </div>
            
            <div style="background-color: #fff5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="text-align: center; color: #333;">
                <p style="margin: 0 0 15px 0;">Your refund request for transaction ${transactionId} has been rejected</p>
                <div style="font-size: 20px; color: #dc3545; font-weight: bold;">
                  REASON: ${reason || "No reason provided"}
                </div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">REJECTION DATE</div>
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
            <div style="margin-top: 10px; color: #dc3545; font-weight: bold;">Thank you for using our service</div>
          </div>
        </div>
        
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto 0; font-size: 12px; color: black; line-height: 1.5;">
          <p>This is an automated notification - please do not reply directly to this message.</p>
          <p>For assistance, visit our support portal or call +63 123 456 7890.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${userData.email}`);

    console.log(`Refund ${transactionId} rejected successfully.`);
    ws.send(
      `[Reject_Refund_Response] Success: Refund ${transactionId} rejected. Email notification sent to ${userData.email}.`
    );
  } catch (error) {
    console.error("Reject refund failed:", error);
    ws.send(`[Reject_Refund_Response] Error: ${error.message}`);
  }
}
