import stripe from "../../Services/stripe.js";
import db from "../../database.js";
import { stripeLogger } from "../../Services/logger.js";

export async function syncBalances() {
  try {
    const bankDocRef = db.collection("GlobalBank").doc("Bank");
    const bankDocSnap = await bankDocRef.get();

    if (!bankDocSnap.exists) {
      throw new Error("Bank document not found in Firebase");
    }

    const firebaseUsdBalance = bankDocSnap.data().USD;
    stripeLogger.info(
      `Firebase USD balance: $${firebaseUsdBalance.toFixed(2)}`
    );

    const stripeBalance = await stripe.balance.retrieve();
    const usdAvailable = stripeBalance.available.find(
      (b) => b.currency === "usd"
    );
    const usdPending = stripeBalance.pending.find((b) => b.currency === "usd");

    const availableBalance = usdAvailable ? usdAvailable.amount / 100 : 0;
    const pendingBalance = usdPending ? usdPending.amount / 100 : 0;
    const grossStripeBalance = availableBalance + pendingBalance;

    stripeLogger.info(`Stripe balances:
    - Available: $${availableBalance.toFixed(2)}
    - Pending: $${pendingBalance.toFixed(2)}
    - Gross Total: $${grossStripeBalance.toFixed(2)}`);

    const difference = firebaseUsdBalance - grossStripeBalance;
    const absoluteDifference = Math.abs(difference);

    if (absoluteDifference < 0.01) {
      stripeLogger.info(
        "Balances are already in sync (including pending transactions)"
      );
      return {
        status: "in-sync",
        firebaseBalance: firebaseUsdBalance,
        stripeAvailableBalance: availableBalance,
        stripePendingBalance: pendingBalance,
        grossStripeBalance: grossStripeBalance,
      };
    }

    stripeLogger.info(`Balance difference: $${difference.toFixed(2)}`);

    const MINIMUM_TRANSFER_AMOUNT = 0.5;

    if (difference > 0 && difference < MINIMUM_TRANSFER_AMOUNT) {
      stripeLogger.info(
        `Difference of $${difference.toFixed(
          2
        )} is below minimum transfer amount of $${MINIMUM_TRANSFER_AMOUNT.toFixed(
          2
        )} - skipping transfer`
      );
      return {
        status: "below-minimum",
        difference: difference,
        minimumAmount: MINIMUM_TRANSFER_AMOUNT,
        firebaseBalance: firebaseUsdBalance,
        stripeAvailableBalance: availableBalance,
        stripePendingBalance: pendingBalance,
        grossStripeBalance: grossStripeBalance,
      };
    }

    if (difference > 0) {
      stripeLogger.info(`Adding $${difference.toFixed(2)} to Stripe balance`);

      const transferResult = await transferToBusiness(
        "cus_S9q4CHhouxcZov",
        difference,
        "Balance synchronization"
      );

      stripeLogger.info("Transfer successful:", transferResult);

      return {
        status: "adjusted",
        action: "added-to-stripe",
        amount: difference,
        newAvailableBalance: availableBalance + difference,
        firebaseBalance: firebaseUsdBalance,
        transferDetails: transferResult,
      };
    } else if (difference < 0) {
      stripeLogger.info(
        `Stripe gross balance exceeds Firebase by $${absoluteDifference.toFixed(
          2
        )}`
      );
      return {
        status: "adjusted",
        action: "stripe-has-more",
        difference: absoluteDifference,
        firebaseBalance: firebaseUsdBalance,
        stripeAvailableBalance: availableBalance,
        stripePendingBalance: pendingBalance,
        grossStripeBalance: grossStripeBalance,
      };
    }
  } catch (error) {
    stripeLogger.error("Balance synchronization failed:", error);
    throw new Error(`Synchronization failed: ${error.message}`);
  }
}

async function transferToBusiness(
  customerId,
  amountInDollars,
  description = ""
) {
  try {
    const amountInCents = Math.round(amountInDollars * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer: customerId,
      description: description || `Transfer of $${amountInDollars}`,
      payment_method_types: ["card"],
    });

    const confirmedIntent = await stripe.paymentIntents.confirm(
      paymentIntent.id,
      {
        payment_method: "pm_card_visa",
      }
    );

    stripeLogger.info(`Successfully processed $${amountInDollars} payment`);

    const balance = await stripe.balance.retrieve();

    stripeLogger.info("Platform's Main Account Balance:");
    const usdAvailable = balance.available.find((b) => b.currency === "usd");
    const usdPending = balance.pending.find((b) => b.currency === "usd");

    if (usdAvailable) {
      stripeLogger.info(`- Available: $${usdAvailable.amount / 100} USD`);
    }
    if (usdPending) {
      stripeLogger.info(`- Pending: $${usdPending.amount / 100} USD`);
    }

    return {
      paymentIntentId: confirmedIntent.id,
      amountReceived: confirmedIntent.amount_received,
      status: confirmedIntent.status,
      platformBalance: {
        available: usdAvailable ? usdAvailable.amount / 100 : 0,
        pending: usdPending ? usdPending.amount / 100 : 0,
      },
    };
  } catch (error) {
    stripeLogger.error("Transfer failed:", error);
    throw new Error(`Payment failed: ${error.message}`);
  }
}

function startSyncInterval() {
  stripeLogger.info("Starting balance synchronization service...");

  const interval = setInterval(async () => {
    try {
      stripeLogger.info("Starting balance sync...");
      const result = await syncBalances();
      stripeLogger.info("Sync completed:", JSON.stringify(result, null, 2));
    } catch (error) {
      stripeLogger.error("Sync error:", error);
    }
  }, 10000);

  return interval;
}

const syncInterval = startSyncInterval();

process.on("SIGTERM", () => {
  clearInterval(syncInterval);
  stripeLogger.info("Balance synchronization service stopped");
});

process.on("SIGINT", () => {
  clearInterval(syncInterval);
  stripeLogger.info("Balance synchronization service stopped");
});
