import db from "../../database.js";

export async function handleFetchRefundRequests(ws, message) {
  try {
    if (!message.startsWith("[Fetch_Refunds_Unapproved]")) {
      throw new Error(
        "Invalid command format. Expected [Fetch_Refunds_Unapproved]"
      );
    }

    const unapprovedRefunds = await db.collectionGroup("Unapproved").get();

    const results = unapprovedRefunds.docs.map((doc) => {
      const pathParts = doc.ref.path.split("/");
      return {
        userId: pathParts[1],
        transactionId: doc.id,
        requestDate: doc.data().timestamp || new Date().toISOString(),
        status: "pending",
        ...doc.data(),
      };
    });



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
    console.error("Error fetching unapproved refunds:", error);

    const errorResponse = {
      status: "error",
      command: "Fetch_Refunds_Unapproved",
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
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
