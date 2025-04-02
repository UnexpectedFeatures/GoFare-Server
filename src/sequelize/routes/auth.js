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
    // Create a transporter object using Gmail service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Ensure this is correctly loaded
        pass: process.env.EMAIL_PASS, // Use the App Password
      },
    });

    // Construct the password reset link
    const resetLink = `http://localhost:5173/reset-password/${token}`;

    // Set up the email options
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender's email
      to: email, // Recipient's email
      subject: 'Password Reset Request', // Email subject
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #e74c3c;">Password Reset Request</h2>
          <p>Dear User,</p>
          <p>We have received a request to reset the password for your account. If you did not initiate this request, please disregard this email, and your password will remain unchanged. Otherwise, please follow the instructions below to reset your password securely:</p>
          
          <p style="text-align: center; font-size: 16px;">
            <a href="${resetLink}" 
               style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; text-align: center;">
              Reset Your Password
            </a>
          </p>
          
          <p style="font-size: 14px; color: #555;">
            The link above will direct you to a page where you can create a new password. Please note that for your security, this link will expire in 1 hour. If you do not reset your password within this time frame, you will need to request a new reset link.
          </p>
          
          <p>If you experience any issues with resetting your password or if you need further assistance, please feel free to contact our support team at <strong>disaster00@gmail.com</strong>.</p>
          
          <p>For your security, please ensure that your new password is unique and contains a combination of uppercase letters, lowercase letters, numbers, and special characters. This will help protect your account from unauthorized access.</p>
          
          <p>If you have any further questions or concerns, don’t hesitate to reach out to us. We are always happy to assist you.</p>

          <p>Thank you for using Your App Name! We are committed to providing you with the best experience possible.</p>

          <p>Best regards,<br/>Team Crocodilo</p>
          
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #ccc;" />
          
          <p style="font-size: 12px; color: #888;">If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
          
          <div style="position: absolute; bottom: 10px; left: 10px; font-size: 12px; color: #888;">Thank you!</div>
        </div>
      `, // HTML content of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully!');
  } catch (error) {
    // Log the error to the console for debugging
    console.error('Error sending reset email:', error);
    // Optionally, send the error to a logging service
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
      return res.status(401).json({ message: "Incorrect password or username." });
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

router.patch("/change-pass/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    console.log("Received data:", { email, oldPassword, newPassword });

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.update(
      { password: hashedPassword },
      { where: { email } }
    );

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
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

router.get("/getUserInfo/:emails", async (req, res) => {
  console.log("Received request for:", req.originalUrl); // Log the full requested URL

  try {
    const emails = req.params.emails;
    const user = await User.findOne({ where: { email: emails } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      role: user.role,
      email: user.email,
      last_login: user.last_login,
    });
  } catch (error) {
    console.error("Error during fetch:", error);
    res.status(500).json({ error: error.message });
  }
});




export default router;
