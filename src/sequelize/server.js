import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Use auth routes
app.use("/api/auth", authRoutes);

// Test Database Connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
})();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Test route
app.get("/", (req, res) => {
  res.send("Server is running...");
});
