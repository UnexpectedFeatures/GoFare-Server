// Add this on Stripe Directory
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function depositToUser(ws, data) {
  try {
    const userId = data.userId;
    const fcmToken = data.fcmToken;
    const amount = data.amount;

    if (!amount) {
      ws.send("Invalid Amount");
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
    });

	ws.send(JSON.stringify({ clientSecret: paymentIntent.client_secret }));
  } catch (error) {
	ws.send("Error ", error)
  }
}

export default stripe;