import db from "../../database.js";

export const handleFetchRequests = async (ws, message) => {
  try {
    console.log("Fetching user requests from Firestore...");

    const requestsSnapshot = await db.collection("UserRequests").get();
    const requests = [];

    for (const requestDoc of requestsSnapshot.docs) {
      const requestId = requestDoc.id;
      const requestData = requestDoc.data();

      const isRequestDocument = Object.keys(requestData).some((key) =>
        key.startsWith("UR")
      );

      if (isRequestDocument) {
        for (const [requestKey, requestDetails] of Object.entries(requestData)) {
          if (!requestKey.startsWith("UR")) continue;

          console.log(`Document ID: ${requestId}, Request Key: ${requestKey}`);

          const request = {
            id: `${requestId}/${requestKey}`,
            documentId: requestId,
            requestKey: requestKey,
            date: requestDetails.date || "",
            description: requestDetails.description || "",
            reason: requestDetails.reason || "",
            requestId: requestDetails.requestId || "",
            status: requestDetails.status || "",
            time: requestDetails.time || "",
            type: requestDetails.type || "",
          };

          Object.keys(request).forEach((key) => {
            if (request[key] === undefined) {
              delete request[key];
            }
          });

          requests.push(request);
        }
      } else {
        const request = {
          id: requestId,
          date: requestData.date || "",
          description: requestData.description || "",
          reason: requestData.reason || "",
          requestId: requestData.requestId || "",
          status: requestData.status || "",
          time: requestData.time || "",
          type: requestData.type || "",
        };

        console.log("Request Data:", request);

        Object.keys(request).forEach((key) => {
          if (request[key] === undefined) {
            delete request[key];
          }
        });

        requests.push(request);
      }
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
