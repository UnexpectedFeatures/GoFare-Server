import db from "../../database.js";

export const handleResolveRequest = async (ws, message) => {
  try {
    console.log("Resolving user request in Firestore...");

    const cleanedMessage = message.replace("[Resolve_Request] ", "");
    const { userId, requestNo } = JSON.parse(cleanedMessage);

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

    await userRequestsRef.update({
      [requestNo]: {
        ...userRequests[requestNo],
        status: "Resolved",
        resolvedAt: new Date().toISOString(),
      },
    });

    const response = {
      type: "SUCCESS",
      message: `Request ${requestNo} has been resolved successfully`,
      requestId: requestNo,
      userId: userId,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(response));
    } else {
      console.error("WebSocket not open, cannot send resolution confirmation");
    }
  } catch (error) {
    console.error("Error resolving user request:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to resolve request",
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
