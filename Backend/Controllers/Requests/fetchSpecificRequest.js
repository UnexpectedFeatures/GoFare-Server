import db from "../../database.js";

export const handleFetchSpecificRequest = async (ws, message) => {
  try {
    console.log("Fetching specific user requests from Firestore...");

    const cleanedMessage = message.replace("[Fetch_Specific_Requests] ", "");
    const { userId, requestNo } = JSON.parse(cleanedMessage);

    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!requestNo) {
      const response = {
        type: "ERROR",
        message: "Request number is required for specific request fetch",
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    const userRequestsRef = db.collection("UserRequests").doc(userId);
    const userRequestsDoc = await userRequestsRef.get();

    if (!userRequestsDoc.exists) {
      const response = {
        type: "REQUEST_DATA",
        data: [],
        message: "No requests found for this user",
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    const userRequests = userRequestsDoc.data();
    const requests = [];

    const specificRequest = userRequests[requestNo];
    if (specificRequest) {
      requests.push({
        requestId: requestNo,
        userId: userId,
        date: specificRequest.date || "",
        description: specificRequest.description || "",
        reason: specificRequest.reason || "",
        status: specificRequest.status || "",
        time: specificRequest.time || "",
        type: specificRequest.type || "",
      });
    } else {
      const response = {
        type: "REQUEST_DATA",
        data: [],
        message: `Request with number ${requestNo} not found`,
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(response));
      return;
    }

    const response = {
      type: "REQUEST_DATA",
      data: requests,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(response));
    } else {
      console.error("WebSocket not open, cannot send request data");
    }
  } catch (error) {
    console.error("Error fetching user requests:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch user requests",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
