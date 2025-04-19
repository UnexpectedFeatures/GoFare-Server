import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config({ path: "../../.ENV" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;
