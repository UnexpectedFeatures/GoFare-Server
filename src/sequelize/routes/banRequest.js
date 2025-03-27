import express from "express";
import BanRequest from "../models/BanRequest.js";

const router = express.Router();

router.post("/ban-request", async (req, res) => {
  const { email, message } = req.body; 

  if (!email || !message || message.trim().length === 0) {
    return res.status(400).json({ error: "Email and message are required." });
  }

  try {
    const newRequest = await BanRequest.create({ email, message });

    res.status(200).json({
      success: "Your request has been submitted successfully.",
      request: newRequest,  
    });
  } catch (error) {
    console.error("Error saving ban request:", error);
    res.status(500).json({ error: "Failed to submit your request. Please try again later." });
  }
});

router.get('/allBanRequests', async (req, res) => {
    try {
        const banRequests = await BanRequest.findAll();
        res.status(200).json(banRequests);
    } catch (error) {
        console.error("Error fetching ban requests:", error);
        res.status(500).json({ message: "Failed to fetch ban requests" });
    }
});

// In backend route file (e.g., banRequest.js)
router.delete("/delete/:email", async (req, res) => {
    const { email } = req.params;
  
    try {
      const request = await BanRequest.findOne({ where: { email } });
      if (!request) {
        return res.status(404).json({ message: "Ban request not found" });
      }
  
      await BanRequest.destroy({ where: { email } });
      return res.status(200).json({ message: `Ban request for ${email} has been deleted.` });
    } catch (error) {
      console.error("Error deleting ban request:", error);
      return res.status(500).json({ message: "Error deleting the ban request." });
    }
});
  
  

  
export default router;
