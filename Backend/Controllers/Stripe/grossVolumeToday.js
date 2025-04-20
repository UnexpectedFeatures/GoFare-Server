import stripe from "../../Services/stripe.js";
import { stripeLogger } from "../../Services/logger.js";

export const fetchGrossToday = async (ws) => {
  try {
    stripeLogger.info("Starting to fetch today's gross volume...");

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0
      )
    );
    const endOfToday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    stripeLogger.info(
      `Time range - Start: ${startOfToday.toISOString()}, End: ${endOfToday.toISOString()}`
    );

    const startTimestamp = Math.floor(startOfToday.getTime() / 1000);
    const endTimestamp = Math.floor(endOfToday.getTime() / 1000);

    stripeLogger.info(
      `Fetching Stripe transactions from ${startTimestamp} to ${endTimestamp}`
    );

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

      stripeLogger.info(
        `Fetched ${batch.data.length} transactions in this batch. Total so far: ${transactions.length}`
      );
    }

    stripeLogger.info(`Total transactions fetched: ${transactions.length}`);

    if (transactions.length === 0) {
      stripeLogger.info("No transactions found for today.");

      const response = {
        type: "GROSS_VOLUME_TODAY",
        data: {
          amountUSD: 0,
          amountPHP: 0,
          exchangeRate: 0,
          transactionCount: 0,
          date: startOfToday.toISOString().split("T")[0],
        },
        timestamp: new Date().toISOString(),
      };

      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(response));
      }
      return response;
    }

    const grossVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const grossVolumeUSD = grossVolume / 100;
    const usdToPhpRate = 56.5;
    const grossVolumePHP = grossVolumeUSD * usdToPhpRate;

    stripeLogger.info("\n--- Today's Gross Volume Summary ---");
    stripeLogger.info(`Date: ${startOfToday.toISOString().split("T")[0]}`);
    stripeLogger.info(`Total USD: $${grossVolumeUSD.toFixed(2)}`);
    stripeLogger.info(`Total PHP: ₱${grossVolumePHP.toFixed(2)}`);
    stripeLogger.info(`Exchange Rate: 1 USD = ${usdToPhpRate} PHP`);
    stripeLogger.info(`Transaction Count: ${transactions.length}`);
    stripeLogger.info("----------------------------------\n");

    const response = {
      USD: grossVolumeUSD,
      PHP: grossVolumePHP,
      date: startOfToday.toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
    };

    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(response));
      stripeLogger.info("Sent today's gross volume data via WebSocket");
    }

    return response;
  } catch (error) {
    stripeLogger.error("Error fetching gross volume:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Failed to fetch today's gross volume",
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    } else {
      stripeLogger.error("WebSocket not available to send error");
    }

    throw error;
  }
};
