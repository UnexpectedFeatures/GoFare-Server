import db from "../../database.js";

export async function handleFetchApprovedRefunds(ws, message) {
  try {
    if (!message.startsWith("[Fetch_Refunds_Approved]")) {
      throw new Error("Invalid command format");
    }

    const approvedRefunds = await db.collectionGroup("Approved").get();

    const results = approvedRefunds.docs.map((doc) => {
      const userId = doc.ref.path.split("/")[1]; 
      return {
        userId,
        transactionId: doc.id,
        ...doc.data(),
      };
    });

    const formattedResponse = {
      status: "success",
      command: "Fetch_Refunds_Approved",
      timestamp: new Date().toISOString(),
      data: results,
    };

    ws.send(
      `[Fetch_Refunds_Approved_Response] ${JSON.stringify(
        formattedResponse,
        null,
        2
      )}`
    );
  } catch (error) {
    console.error("Error fetching approved refunds:", error);

    const errorResponse = {
      status: "error",
      command: "Fetch_Refunds_Approved",
      timestamp: new Date().toISOString(),
      error: error.message,
    };

    ws.send(
      `[Fetch_Refunds_Approved_Response] ${JSON.stringify(
        errorResponse,
        null,
        2
      )}`
    );
  }
}
