import db from "../../database.js";

// Utility to safely handle WebSocket communication
const sendWebSocketResponse = (ws, message) => {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(message);
  } else {
    console.error("WebSocket not open or ws is undefined.");
  }
};

// Utility to safely handle Firestore timestamp data
const toISOStringSafely = (timestamp) => {
  return timestamp ? timestamp : "—";  // Handle the timestamp or fallback to "—"
};

export const handleFetchTrainDetails = async (ws, message) => {
  try {
    console.log("Fetching Train Details from Firestore...");

    // Fetch the train position document from Firestore
    const trainDoc = await db.collection("TrainSimulation").doc("CurrentPosition").get();

    if (!trainDoc.exists) {
      console.error("Train position document not found.");

      const notFoundResponse = {
        type: "Train_DATA",
        data: {
          message: "Train position data not found."
        },
        status: "TRAIN_POSITION_NOT_FOUND",
        timestamp: new Date().toISOString(),
      };

      // Send the response via WebSocket if the connection is open
      sendWebSocketResponse(ws, `[Train_Data] ${JSON.stringify(notFoundResponse)}`);
      return;
    }

    // Extract train data
    const trainData = trainDoc.data();
    const trainDetails = {
      documentId: trainDoc.id,
      displayDate: toISOStringSafely(trainData.displayDate),
      displayTime: toISOStringSafely(trainData.displayTime),
      lastUpdated: toISOStringSafely(trainData.lastUpdated),
      routeId: trainData.routeId || "—",
      routeName: trainData.routeName || "—",
      status: trainData.status ? "Active" : "Inactive",
      stopId: trainData.stopId || "—",
      stopIndex: trainData.stopIndex || "—",
      stopName: trainData.stopName || "—",
    };

    // Send a success response
    const response = {
      type: "Train_DATA",
      data: trainDetails,
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
    };

    sendWebSocketResponse(ws, `[Train_Data] ${JSON.stringify(response)}`);

  } catch (error) {
    console.error("Error fetching Train Details:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch Train Details",
      error: error.message,
    };

    sendWebSocketResponse(ws, JSON.stringify(errorResponse));
  }
};
