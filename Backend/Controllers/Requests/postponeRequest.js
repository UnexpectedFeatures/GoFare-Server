import db from "../../database.js";

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
    const userRequestsDoc = await userRequestsRef.get();

    if (!userRequestsDoc.exists) {
      const response = {
        type: "ERROR",
        message: "User requests document not found",
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    const userRequests = userRequestsDoc.data();

    if (!userRequests[requestNo]) {
      const response = {
        type: "ERROR",
        message: `Request ${requestNo} not found for this user`,
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
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

    const response = {
      type: "SUCCESS",
      message: `Request ${requestNo} has been postponed`,
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
