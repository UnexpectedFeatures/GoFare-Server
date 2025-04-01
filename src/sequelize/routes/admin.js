import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminModel from "../models/Admin.js";

const router = express.Router();

router.post("/adminLogin", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
    
        const admin = await AdminModel.findOne({ where: { email } });
        if (!admin) {
            return res.status(404).json({ message: "Incorrect email or password." });
        }
    
        if (admin.status === "banned") {
            return res.status(403).json({ message: "Your account has been banned.", status: "banned" });
        }
    
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect email or password." });
        }
    
        const lastLogin = admin.last_login ? admin.last_login.toISOString() : "First login";
    
        await AdminModel.update(
            { last_login: new Date() },
            { where: { email } }
        );
    
        const token = jwt.sign(
            { userId: admin.id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        res.json({
            token,
            username: admin.username,
            role: admin.role,
            lastLogin,
            status: admin.status,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
    }
});

router.post("/create-mod", async (req, res) => {
    console.log("🔹 Received Data:", req.body); // ✅ Log request payload

    const { username, email, password, phone, gender, birthday, address } = req.body;

    const existingMod = await AdminModel.findOne({ email });
    if (!username || !email || !password || !phone || !gender || !birthday || !address) {
        return res.status(400).json({ message: "All fields are required!" });
    }
    
    try {
        // 🔹 Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newMod = await AdminModel.create({
            username,
            email,
            password: hashedPassword,  // ✅ Store hashed password
            phone,
            gender,
            birthday,
            address,
            role: "moderator",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        res.status(201).json({ message: "Moderator created successfully!", newMod });
    } catch (error) {
        console.error("🔹 Error creating moderator:", error);
        
        
        if (existingMod) {
            return res.status(400).json({ message: "Email is already taken!" });
        }
        else {
            res.status(500).json({ message: "Server error" });
        }
    }
});


  
export default router;