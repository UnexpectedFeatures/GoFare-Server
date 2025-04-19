import db from "../database.js";

export const handleFetchTransactions = async (ws, message) => {
  try {
    console.log("Fetching transactions from Firestore...");

    const usersSnapshot = await db.collection("UserTransaction").get();
    const transactions = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      for (const [txKey, txData] of Object.entries(userData)) {
        if (!txKey.startsWith("TX-")) continue;

        const transaction = {
          id: `${userId}/${txKey}`,
          userId: userId,
          transactionKey: txKey,
          currentBalance: txData.currentBalance || 0,
          datetime: txData.datetime || "",
          discount: txData.discount || false,
          dropoff: txData.dropoff || "",
          loaned: txData.loaned || false,
          loanedAmount: txData.loanedAmount || 0,
          pickup: txData.pickup || "",
          remainingBalance: txData.remainingBalance || 0,
          totalAmount: txData.totalAmount || 0,
          name: txData.name || "",
        };

        Object.keys(transaction).forEach((key) => {
          if (transaction[key] === undefined) {
            delete transaction[key];
          }
        });

        transactions.push(transaction);
      }
    }

    const response = {
      type: "TRANSACTION_DATA",
      data: transactions,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(response));
    } else {
      console.error("WebSocket not open, cannot send transaction data");
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch transactions",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
