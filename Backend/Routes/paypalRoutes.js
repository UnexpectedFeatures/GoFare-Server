// paypalRoutes.js
import express from "express";
import {
  authenticatePayPal,
  createOrder,
  capturePayment,
  verifyPayment,
} from "../Controllers/paypal.js";

const router = express.Router();

router.get("/login", async (req, res) => {
  try {
    const token = await authenticatePayPal();
    res.json({
      message: "Authentication successful!",
      accessToken: token,
    });
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

router.post("/create-order", async (req, res) => {
  const { amount, currency } = req.body;
  try {
    const order = await createOrder(amount, currency);
    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

router.post("/capture-payment", async (req, res) => {
  const { orderId } = req.body;
  try {
    const result = await capturePayment(orderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

router.get("/verify-payment/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await verifyPayment(orderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

export default router;
