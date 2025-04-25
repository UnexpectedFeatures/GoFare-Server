import db from "../../database.js";

export async function handleFetchRefundRequests(ws, message) {
  try {
    // Validate message format
    if (typeof message !== 'string' || !message.startsWith("[Fetch_Refunds_Unapproved]")) {
      throw new Error("Invalid command format. Expected [Fetch_Refunds_Unapproved]");
    }

    // Fetch unapproved refunds with error handling for the query
    const unapprovedRefunds = await db.collectionGroup("Unapproved")
      .get()
      .catch(err => {
        console.error("Firestore query failed:", err);
        throw new Error("Failed to retrieve refund requests from database");
      });

    // Process results with additional validation
    const results = unapprovedRefunds.docs.map((doc) => {
      if (!doc.exists) {
        console.warn("Document does not exist:", doc.id);
        return null;
      }





      const pathParts = doc.ref.path.split("/");
      if (pathParts.length < 2) {
        console.warn("Unexpected document path format:", doc.ref.path);
        return null;
      }

      const docData = doc.data();
      return {
        userId: pathParts[1],
        transactionId: doc.id,
        requestDate: docData.timestamp || new Date().toISOString(),
        status: "pending",
        ...docData,
      };
    }).filter(Boolean); // Remove any null entries from invalid documents

    
    console.log("reslts: ", results)
    console.log(`Fetched ${results.length} unapproved refund requests`);

    const response = {
      status: "success",
      command: "Fetch_Refunds_Unapproved",
      timestamp: new Date().toISOString(),
      count: results.length,
      refunds: results,
    };

    ws.send(
      `[Fetch_Refunds_Unapproved_Response] ${JSON.stringify(response, null, 2)}`
    );
  } catch (error) {
    console.error("Error in handleFetchRefundRequests:", error);

    const errorResponse = {
      status: "error",
      command: "Fetch_Refunds_Unapproved",
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
        details: error.details || null,
      },
    };

    ws.send(
      `[Fetch_Refunds_Unapproved_Response] ${JSON.stringify(
        errorResponse,
        null,
        2
      )}`
    );
  }
}