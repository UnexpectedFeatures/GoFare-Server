import db from "../../database.js";
import transporter from "../../Services/mailSender.js";

export const handlePostponeRequest = async (ws, message) => {
  try {
    console.log("Postponing user request in Firestore...");

    const cleanedMessage = message.replace("[Postpone_Request] ", "");
    const { userId, requestNo, postponeReason } = JSON.parse(cleanedMessage);

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!requestNo) {
      throw new Error("Request number is required");
    }

    const userRequestsRef = db.collection("UserRequests").doc(userId);
    const userDocRef = db.collection("Users").doc(userId);

    const [userRequestsDoc, userDoc] = await Promise.all([
      userRequestsRef.get(),
      userDocRef.get(),
    ]);

    if (!userRequestsDoc.exists) {
      const response = {
        type: "ERROR",
        message: "User requests document not found",
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    if (!userDoc.exists) {
      const response = {
        type: "ERROR",
        message: `User ${userId} not found`,
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    const userRequests = userRequestsDoc.data();
    const userData = userDoc.data();

    if (!userRequests[requestNo]) {
      const response = {
        type: "ERROR",
        message: `Request ${requestNo} not found for this user`,
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    if (!userData.email) {
      throw new Error(`Email not found for user ${userId}`);
    }

    if (!userData.firstName || !userData.lastName) {
      throw new Error(`First name or last name not found for user ${userId}`);
    }

    const updateData = {
      [requestNo]: {
        ...userRequests[requestNo],
        status: "Postponed",
        postponedAt: new Date().toISOString(),
        postponeReason: postponeReason || "No reason provided",
      },
    };

    await userRequestsRef.update(updateData);

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
      subject: `Request Postponement Notice`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 2px solid #ffc107; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #ffc107; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Request Postponed</h1>
          </div>
          
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
              <div>
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">USER</div>
                <div style="font-weight: bold; font-size: 18px;">${formattedName}</div>
              </div>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <div style="text-align: center; color: #333;">
                <p style="margin: 0 0 15px 0;">Your request (ID: ${requestNo}) has been postponed</p>
                <div style="font-size: 20px; color: #ffc107; font-weight: bold;">
                  REASON: ${postponeReason || "No reason provided"}
                </div>
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px;">
              <div style="flex: 1;">
                <div style="color: black; font-size: 12px; margin-bottom: 3px;">POSTPONEMENT DATE</div>
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
            <div style="margin-top: 10px; color: #ffc107; font-weight: bold;">Thank you for using our service</div>
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

    const response = {
      type: "SUCCESS",
      message: `Request ${requestNo} has been postponed. Email notification sent to ${userData.email}.`,
      requestId: requestNo,
      userId: userId,
      status: "Postponed",
      postponeReason: postponeReason,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(response));
    } else {
      console.error(
        "WebSocket not open, cannot send postponement confirmation"
      );
    }
  } catch (error) {
    console.error("Error postponing user request:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to postpone request",
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
