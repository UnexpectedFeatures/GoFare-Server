import admin from "firebase-admin";
import transporter from "../../Services/mailSender.js";

export async function handleDeactivateRFID(ws, message) {
  try {
    const cleanedMessage = message.replace("[Deactivate_RFID] ", "");
    const userId = JSON.parse(cleanedMessage);

    if (!userId) {
      ws.send("[Deactivate_RFID_Response] Error: User ID is required");
      return;
    }

    const firestore = admin.firestore();

    const userDocRef = firestore.collection("Users").doc(userId);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      ws.send(
        `[Deactivate_RFID_Response] Error: User ${userId} not found in User collection`
      );
      return;
    }

    const userRFIDRef = firestore.collection("UserRFID").doc(userId);
    const userRFIDSnapshot = await userRFIDRef.get();

    if (!userRFIDSnapshot.exists) {
      ws.send(
        `[Deactivate_RFID_Response] Error: User ${userId} not found in RFID collection`
      );
      return;
    }

    const userData = userDocSnapshot.data();
    const userRFIDData = userRFIDSnapshot.data();

    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const formattedName = fullName ? fullName.toUpperCase() : "USER";

    if (!userData.email) {
      ws.send(
        `[Deactivate_RFID_Response] Error: Email not found for user ${userId}`
      );
      return;
    }

    await userRFIDRef.update({
      rfidActive: false,
      lastDeactivation: admin.firestore.FieldValue.serverTimestamp(),
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: userData.email,
      subject: `RFID Deactivation Notice`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #dc3545; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #dc3545; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">RFID Deactivated</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">USER</div>
                <div style="font-weight: bold; font-size: 18px;">${formattedName}</div>
              </div>
            </div>
            
            <!-- Status banner -->
            <div style="background-color: #f5f9ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="text-align: center; color: #333;">
                <p style="margin: 0 0 15px 0;">Your GoFare RFID card has been deactivated</p>
                <div style="font-size: 24px; color: #dc3545; font-weight: bold;">
                  STATUS: INACTIVE
                </div>
              </div>
            </div>
            
            <!-- Date/time section -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">DEACTIVATION DATE</div>
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
            
            <!-- Footer message -->
            <div style="border-top: 2px dashed #ccc; padding-top: 15px; text-align: center; color: #666; font-size: 14px;">
              <p>If this was unexpected or you need assistance, please contact our support team.</p>
            </div>
          </div>
          
          <!-- Bottom stamp -->
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
            <div style="margin-top: 10px; color: #dc3545; font-weight: bold;">We hope to serve you again soon</div>
          </div>
        </div>
        
        <!-- Disclaimer text -->
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto 0; font-size: 12px; color: black; line-height: 1.5;">
          <p>This is an automated notification - please do not reply directly to this message.</p>
          <p>For assistance, visit our support portal or call +63 123 456 7890.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Deactivation email sent to ${userData.email}`);

    ws.send(
      `[Deactivate_RFID_Response] Success: RFID user ${userId} deactivated`
    );
  } catch (error) {
    console.error("Deactivation Error:", error.message);
    ws.send(`[Deactivate_RFID_Response] Error: ${error.message}`);
  }
}
