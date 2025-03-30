import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"; 
import nodemailer from "nodemailer";
import User from "../models/User.js";
import dotenv from "dotenv";
import { Op } from "sequelize";


dotenv.config(); // Load environment variables

const router = express.Router();

const sendResetEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Ensure this is correctly loaded
        pass: process.env.EMAIL_PASS, // Use the App Password
      },
    });

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>This link will expire in 1 hour.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user without checking for duplicate username
    const user = await User.create({ username, email, password: hashedPassword });

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "User created successfully",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: error.message });
  }
});


// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Incorrect password or username." });
    }
  
    if (user.banned) {
      return res.status(403).json({ message: "Your account has been banned.", status: "banned" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const lastLogin = user.last_login ? user.last_login.toISOString() : "First login";

    await User.update(
      { last_login: new Date() },
      { where: { email } }
    );

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    res.json({
      token,
      username: user.username,
      role: user.role,
      lastLogin, 
      status: user.status,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: error.message });
  }
});

//For Admin where it Select all the 'Users'

router.get("/users/:roles", async (req, res) => {
  try {
    let roles = req.params.roles.toLowerCase();
    
    if (roles !== "admin" && roles !== "moderator") {
      return res.status(403).json({ error: "Access denied" });
    }
    const users = await User.findAll({
      attributes: ["username", "email", "createdAt", "updatedAt", "status", "last_login", "role"],
      where: { role: "user" },
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// This is only for Highest Admin
router.get("/mods/:roles", async (req, res) => {
  try {
    let roles = req.params.roles.toLowerCase();
    
    if (roles !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const users = await User.findAll({
      attributes: ["username", "email", "createdAt", "updatedAt", "status", "last_login", "role"],
      where: { role: "moderator" },
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//For user information
router.get("/users/info/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({
      attributes: ["username", "email", "phone", "birthday", "role", "gender", "home_address", "last_login"],
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//Ban the users
router.post("/users/ban/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.update({ status: "banned" }, { where: { email } });

    res.json({ message: "User banned successfully" });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ error: error.message });
  }
});

//Unban ofcourse
router.post("/users/unban/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.update({ status: "active" }, { where: { email } });

    res.json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/updateUser/:email', async (req, res) => {
  const { email } = req.params;
  const { username, phone, birthday, gender, home_address } = req.body;
  
  // Validate required fields
  if (!username || !phone || !birthday || !gender || !home_address) {
    return res.status(400).json({ message: "All fields are required." });
  }
  
  console.log("Received data:", { username, phone, birthday, gender, home_address, email });

  try {
    const [numberOfAffectedRows] = await User.update(
      {
        username,
        phone,
        birthday,
        gender,
        home_address, 
      },
      { where: { email } }
    );

    if (numberOfAffectedRows > 0) {
      return res.status(200).json({ message: "User information updated successfully." });
    } else {
      return res.status(400).json({ message: "User not found or update failed." });
    }
  } catch (error) {
    console.error("Error occurred during update:", error);
    res.status(500).json({ message: "An error occurred while updating user information." });
  }
});

router.post("/create-mod", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "User created successfully",
      token,
      role: "moderator",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await User.update(
      { resetToken: hashedToken, resetTokenExpires: new Date(Date.now() + 3600000) },
      { where: { email } }
    );

    await sendResetEmail(email, resetToken);

    res.json({ message: "Password reset link sent to your email!" });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      { 
        password: hashedPassword, 
        resetToken: null, 
        resetTokenExpires: null 
      },
      { where: { id: user.id } }
    );

    res.json({ message: "✅ Password reset successful! You can now log in." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
