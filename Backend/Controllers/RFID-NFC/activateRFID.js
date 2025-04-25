import admin from "firebase-admin";
import transporter from "../../Services/mailSender.js";

export async function handleActivateRFID(ws, message) {
  try {
    const cleanedMessage = message.replace("[Activate_RFID] ", "");
    const parsed = JSON.parse(cleanedMessage);

    const userId = parsed.userId;
   
    console.log("User ID:", userId);

    if (!userId) {
      ws.send("[Activate_RFID_Response] Error: User ID is required");
      return;
    }

    console.log("Activating RFID for user:", userId);

    const firestore = admin.firestore();

    const userDocRef = firestore.collection("Users").doc(userId);
    const userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      ws.send(
        `[Activate_RFID_Response] Error: User ${userId} not found in User collection`
      );
      return;
    }
    console.log("Activating RFID for user 2:", userId);

    const userRFIDRef = firestore.collection("UserRFID").doc(userId);
    const userRFIDSnapshot = await userRFIDRef.get();

    if (!userRFIDSnapshot.exists) {
      ws.send(
        `[Activate_RFID_Response] Error: User ${userId} not found in RFID collection`
      );
      console.log("User RFID not found:", userId);
      return;
    }

 
    try{
      await userRFIDRef.update({
        rfidActive: true,
        lastActivation: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("RFID activated successfully for user:", userId);
  
    }catch(error){  
     console.error("Error updating RFID document:", error.message);  
    }

  

    const userData = userDocSnapshot.data();
    const firstName = userData.firstName || "";
    const lastName = userData.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const formattedName = fullName ? fullName.toUpperCase() : "USER";

    if (!userData.email) {
      ws.send(
        `[Activate_RFID_Response] Error: Email not found for user ${userId}`
      );
      return;
    }

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: userData.email,
      subject: `RFID Activation Notice`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #28a745; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #28a745; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">RFID Activated</h1>
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
                <p style="margin: 0 0 15px 0;">Your GoFare RFID card has been activated</p>
                <div style="font-size: 24px; color: #28a745; font-weight: bold;">
                  STATUS: ACTIVE
                </div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">ACTIVATION DATE</div>
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
            <div style="margin-top: 10px; color: #28a745; font-weight: bold;">Enjoy seamless travel with your GoFare RFID</div>
          </div>
        </div>
        
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto 0; font-size: 12px; color: black; line-height: 1.5;">
          <p>This is an automated notification - please do not reply directly to this message.</p>
          <p>For assistance, visit our support portal or call +63 123 456 7890.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Activation email sent to ${userData.email}`);

    ws.send(`[Activate_RFID_Response] Success: RFID user ${userId} activated`);
  } catch (error) {
    console.error("Activation Error:", error.message);
    ws.send(`[Activate_RFID_Response] Error: ${error.message}`);
  }
}
