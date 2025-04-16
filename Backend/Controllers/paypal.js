import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === "production"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

let accessToken = null;

export async function authenticatePayPal() {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    console.error(
      "PayPal authentication error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function createOrder(amount, currency = "USD") {
  try {
    if (!accessToken) {
      await authenticatePayPal();
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "PayPal create order error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function capturePayment(orderId) {
  try {
    if (!accessToken) {
      await authenticatePayPal();
    }

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "PayPal capture payment error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

export async function verifyPayment(orderId) {
  try {
    if (!accessToken) {
      await authenticatePayPal();
    }

    const response = await axios.get(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "PayPal verify payment error:",
      error.response?.data || error.message
    );
    throw error;
  }
}
