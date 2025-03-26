import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";  // ✅ Ensure 'uploads' folder exists
import path from "path";
import sequelize from "./db.js";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);

(async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected successfully!");

        await sequelize.sync({ alter: true }); 
        console.log("✅ Database synchronized!");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
})();

// Root route
app.get("/", (req, res) => {
    res.send("Server is running...");
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
