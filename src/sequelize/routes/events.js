import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Event from "../models/Event.js";

const router = express.Router();

// ✅ Ensure the 'uploads/' folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Saving file to:", uploadDir);
        cb(null, "uploads/"); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        console.log("Generated Filename:", uniqueName);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        console.log("Processing file:", file.originalname);
        if (!file.mimetype.startsWith("image/")) {
            console.log("File rejected:", file.mimetype);
            return cb(new Error("Only images are allowed!"), false);
        }
        cb(null, true);
    }
});

// ✅ Create Event Route
router.post("/createEvent", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            console.log("❌ No file received.");
            return res.status(400).json({ error: "No image uploaded" });
        }

        const { title, description, date } = req.body;
        const imagePath = `/uploads/${req.file.filename}`;

        console.log("✅ Uploaded File:", req.file);
        console.log("📁 File stored at:", path.resolve(req.file.path));

        const event = await Event.create({
            title,
            description,
            date,
            image: imagePath
        });

        res.status(201).json(event);
    } catch (error) {
        console.error("❌ Error creating event:", error);
        res.status(500).json({ error: "Error creating event", details: error.message });
    }
});

// ✅ Get All Active Events
router.get("/getEvents", async (req, res) => {
    try {
        const events = await Event.findAll({
            where: { status: "active" } // Fetch only active events
        });
        res.json(events);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ error: "Error fetching events" });
    }
});


// ✅ Get All Events for Event List
router.get("/allEvents", async (req, res) => {
    try {
        const events = await Event.findAll(); // Fetch all events without filtering by status
        res.json(events);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ error: "Error fetching events" });
    }
});

router.put("/updateStatus/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const event = await Event.findByPk(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        event.status = status;
        await event.save();

        res.json({ message: "Event status updated successfully", event });
    } catch (error) {
        console.error("❌ Error updating event status:", error);
        res.status(500).json({ error: "Error updating event status" });
    }
});

// Eyy, finally this is for Delete
router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        const event = await Event.findByPk(id);
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        await event.destroy();
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting event:", error);
        res.status(500).json({ error: "Error deleting event" });
    }
});

export default router;
