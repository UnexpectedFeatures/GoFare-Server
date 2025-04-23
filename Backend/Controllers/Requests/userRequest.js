import db from "../../database.js";
import admin from "firebase-admin";
import transporter from "../../Services/mailSender.js";

export async function handleUserRequest(ws, message) {
  try {
    const cleanedMessage = message.replace("[User_Request] ", "");
    console.log("Incoming message:", message);

    const { userId, requestId, description, reason, type } =
      JSON.parse(cleanedMessage);

    if (!userId || !requestId || !description || !reason || !type) {
      throw new Error(
        "userId, requestId, description, reason, and type are required"
      );
    }
    if (!/^UR-\d{4}$/.test(requestId)) {
      throw new Error(
        "Request ID must follow the format 'UR-' followed by four digits (e.g., UR-0002)"
      );
    }

    const userDoc = await db.collection("Users").doc(userId).get();
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }

    const userData = userDoc.data();
    if (!userData.email) {
      throw new Error(`Email not found for user ${userId}`);
    }
    if (!userData.firstName || !userData.lastName) {
      throw new Error(`First name or last name not found for user ${userId}`);
    }

    const userRequestsRef = db.collection("UserRequests").doc(userId);
    const userRequestsDoc = await userRequestsRef.get();
    if (userRequestsDoc.exists && userRequestsDoc.data()[requestId]) {
      throw new Error(`Request ${requestId} already exists for user ${userId}`);
    }

    const requestData = {
      date: new Date().toISOString().split("T")[0],
      description,
      reason,
      requestId,
      type,
      status: "Pending",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRequestsRef.set(
      {
        [requestId]: requestData,
      },
      { merge: true }
    );

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
      subject: `Request Submission Notice`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #17a2b8; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #17a2b8; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Request Submitted</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">USER</div>
                <div style="font-weight: bold; font-size: 18px;">${formattedName}</div>
              </div>
            </div>
            
            <div style="background-color: #e6f7fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="text-align: center; color: #333;">
                <p style="margin: 0 0 15px 0;">Your request (ID: ${requestId}) has been submitted</p>
                <div style="font-size: 24px; color: #17a2b8; font-weight: bold;">
                  STATUS: PENDING
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="color: black; font-size: 12px; margin-bottom: 3px;">REQUEST TYPE</div>
              <div style="font-weight: bold;">${type}</div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="color: black; font-size: 12px; margin-bottom: 3px;">DESCRIPTION</div>
              <div style="font-weight: bold;">${description}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">SUBMISSION DATE</div>
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
            <div style="margin-top: 10px; color: #17a2b8; font-weight: bold;">Thank you for using our service</div>
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

    ws.send(
      `[User_Request_Response] Success: Request ${requestId} created for user ${userId}. Email notification sent to ${userData.email}.`
    );
  } catch (error) {
    console.error("User request creation failed:", error);
    ws.send(`[User_Request_Response] Error: ${error.message}`);
  }
}
