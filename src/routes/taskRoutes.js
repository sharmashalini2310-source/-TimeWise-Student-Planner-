const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");
const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch { res.status(500).json({ message: "Could not load tasks." }); }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, dueDate, priority, category } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "Task title is required." });
    const task = await Task.create({ user: req.userId, title: title.trim(), description, dueDate, priority, category });
    res.status(201).json(task);
  } catch { res.status(400).json({ message: "Could not create task. Check the submitted values." }); }
});

router.put("/:id", async (req, res) => {
  try {
    const allowed = ["title", "description", "dueDate", "priority", "category", "completed"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch { res.status(400).json({ message: "Could not update task." }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json({ message: "Task deleted successfully." });
  } catch { res.status(400).json({ message: "Could not delete task." }); }
});

module.exports = router;
