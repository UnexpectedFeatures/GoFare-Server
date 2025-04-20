import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config({ path: "../../.ENV" });

const app = express();
const stripe = new Stripe(process.env.STRIPE_KEY_2);

app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  console.log("Triggered Payment");
  try {
    const { amount } = req.body;

    if (!amount) {
      console.log("Amount is Required");
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
    });

    console.log("Top Up Status:");
    console.log("Amount:", amount);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
