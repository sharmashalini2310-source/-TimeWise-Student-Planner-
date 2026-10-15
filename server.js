require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./src/routes/authRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const scheduleRoutes = require("./src/routes/scheduleRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "TimeWise API is running." });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/schedule", scheduleRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing. Create a .env file from .env.example.");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => console.log(`🚀 TimeWise is running at http://localhost:${PORT}`));
  } catch (error) {
    console.error("❌ Startup error:", error.message);
    process.exit(1);
  }
}
start();
