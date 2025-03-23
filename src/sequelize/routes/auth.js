import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import db from "../db.js";


dotenv.config(); // Load environment variables

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
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
      return res.status(404).json({ message: "User not found" });
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
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["username", "email", "createdAt", "updatedAt", "status", "last_login", "role"], // Include role
      where: {
        role: ["user"], // Exclude admin and moderator
      },
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






export default router;
