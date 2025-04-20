import db from "../../database.js";

export const handleFetchUserRequests = async (ws, message) => {
  try {
    console.log("Fetching all user requests from Firestore...");

    const cleanedMessage = message.replace("[Fetch_User_Requests] ", "");
    const { userId } = JSON.parse(cleanedMessage);

    if (!userId) {
      throw new Error("User ID is required");
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

    for (const [requestKey, requestDetails] of Object.entries(userRequests)) {
      if (requestKey.startsWith("UR")) {
        requests.push({
          requestId: requestKey,
          userId: userId,
          date: requestDetails.date || "",
          description: requestDetails.description || "",
          reason: requestDetails.reason || "",
          status: requestDetails.status || "",
          time: requestDetails.time || "",
          type: requestDetails.type || "",
        });
      }
    }

    requests.sort((a, b) => new Date(b.date) - new Date(a.date));

    const response = {
      type: "REQUEST_DATA",
      data: requests,
      message:
        requests.length > 0
          ? `Found ${requests.length} requests`
          : "No valid requests found",
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
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
