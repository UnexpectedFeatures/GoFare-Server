import express from "express";
import fetchUsers from "./Controllers/fetchAll.js";

const app = express();
const PORT = process.env.PORT;

async function initializeApp() {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    await fetchUsers();
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

initializeApp();
