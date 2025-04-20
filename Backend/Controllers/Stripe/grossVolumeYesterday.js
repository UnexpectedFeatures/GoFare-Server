import stripe from "../../Services/stripe.js";
import db from "../../database.js";
import { stripeLogger } from "../../Services/logger.js";

export const fetchGrossYesterday = async (ws) => {
  try {
    stripeLogger.info("Starting to fetch yesterday's gross volume...");

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const startOfYesterday = new Date(
      Date.UTC(
        yesterday.getUTCFullYear(),
        yesterday.getUTCMonth(),
        yesterday.getUTCDate(),
        0,
        0,
        0
      )
    );

    const endOfYesterday = new Date(
      Date.UTC(
        yesterday.getUTCFullYear(),
        yesterday.getUTCMonth(),
        yesterday.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    const startTimestamp = Math.floor(startOfYesterday.getTime() / 1000);
    const endTimestamp = Math.floor(endOfYesterday.getTime() / 1000);

    let transactions = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = {
        created: { gte: startTimestamp, lte: endTimestamp },
        limit: 100,
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const batch = await stripe.balanceTransactions.list(params);
      transactions = transactions.concat(batch.data);
      hasMore = batch.has_more;

      if (batch.data.length > 0) {
        startingAfter = batch.data[batch.data.length - 1].id;
      }
    }

    const grossVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const grossVolumeUSD = grossVolume / 100;
    const usdToPhpRate = 56.5;
    const grossVolumePHP = grossVolumeUSD * usdToPhpRate;

    const simplifiedResponse = {
      USD: grossVolumeUSD,
      PHP: grossVolumePHP,
      date: startOfYesterday.toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
    };

    const detailedResponse = {
      type: "GROSS_VOLUME_YESTERDAY",
      data: {
        date: startOfYesterday.toISOString().split("T")[0],
        amountUSD: grossVolumeUSD,
        amountPHP: grossVolumePHP,
        exchangeRate: usdToPhpRate,
        transactionCount: transactions.length,
        transactions: transactions.slice(0, 100),
      },
      timestamp: new Date().toISOString(),
    };

    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(simplifiedResponse));
      stripeLogger.info("Sent yesterday's gross volume data via WebSocket");
    } else {
      stripeLogger.warn(
        "WebSocket not available or not open, returning data directly"
      );
      return simplifiedResponse;
    }
  } catch (error) {
    stripeLogger.error("Error fetching yesterday's gross volume:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch yesterday's gross volume",
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    } else {
      stripeLogger.error("WebSocket not available to send error");
      throw error;
    }
  }
};
