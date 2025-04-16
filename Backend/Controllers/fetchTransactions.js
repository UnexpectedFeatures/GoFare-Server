import db from "../database.js";

export const handleFetchTransactions = async (ws, message) => {
  try {
    console.log("Fetching transactions from Firestore...");

    const transactionsSnapshot = await db.collection("UserTransaction").get();
    const transactions = [];

    transactionsSnapshot.forEach((doc) => {
      const transactionData = doc.data();

      const transaction = {
        id: doc.id, 
        currentBalance: transactionData.currentBalance || 0,
        datetime: transactionData.datetime || "",
        discount: transactionData.discount || false,
        dropoff: transactionData.dropoff || "",
        loaned: transactionData.loaned || false,
        loanedAmount: transactionData.loanedAmount || 0,
        pickup: transactionData.pickup || "",
        remainingBalance: transactionData.remainingBalance || 0,
        totalAmount: transactionData.totalAmount || 0,
      };

      Object.keys(transaction).forEach((key) => {
        if (transaction[key] === undefined) {
          delete transaction[key];
        }
      });

      transactions.push(transaction);
    });

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
