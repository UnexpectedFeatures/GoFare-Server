import db from "../../database.js";

export async function handleFetchRejectedRefunds(ws, message) {
  try {
    if (!message.startsWith("[Fetch_Refunds_Rejected]")) {
      throw new Error("Invalid command format");
    }

    const rejectedRefunds = await db.collectionGroup("Rejected").get();

    const results = rejectedRefunds.docs.map((doc) => {
      const pathParts = doc.ref.path.split("/");
      const userId = pathParts[1];

      return {
        userId,
        transactionId: doc.id,
        ...doc.data(),
      };
    });

    const formattedResponse = {
      status: "success",
      command: "Fetch_Refunds_Rejected",
      timestamp: new Date().toISOString(),
      count: results.length,
      data: results,
    };

    ws.send(
      `[Fetch_Refunds_Rejected_Response] ${JSON.stringify(
        formattedResponse,
        null,
        2
      )}`
    );
  } catch (error) {
    console.error("Error fetching rejected refunds:", error);

    const errorResponse = {
      status: "error",
      command: "Fetch_Refunds_Rejected",
      timestamp: new Date().toISOString(),
      error: error.message,
    };

    ws.send(
      `[Fetch_Refunds_Rejected_Response] ${JSON.stringify(
        errorResponse,
        null,
        2
      )}`
    );
  }
}
