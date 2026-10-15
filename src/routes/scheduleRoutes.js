const express = require("express");
const Schedule = require("../models/Schedule");
const auth = require("../middleware/auth");
const router = express.Router();
router.use(auth);

router.get("/", async (req, res) => {
  try { res.json(await Schedule.find({ user: req.userId }).sort({ day: 1, startTime: 1 })); }
  catch { res.status(500).json({ message: "Could not load timetable." }); }
});
router.post("/", async (req, res) => {
  try {
    const { subject, day, startTime, endTime, location } = req.body;
    if (!subject?.trim() || !day || !startTime || !endTime) return res.status(400).json({ message: "Subject, day, start time, and end time are required." });
    const entry = await Schedule.create({ user: req.userId, subject: subject.trim(), day, startTime, endTime, location });
    res.status(201).json(entry);
  } catch { res.status(400).json({ message: "Could not add timetable entry." }); }
});
router.put("/:id", async (req, res) => {
  try {
    const allowed = ["subject", "day", "startTime", "endTime", "location"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const entry = await Schedule.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ message: "Timetable entry not found." });
    res.json(entry);
  } catch { res.status(400).json({ message: "Could not update timetable entry." }); }
});
router.delete("/:id", async (req, res) => {
  try {
    const entry = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!entry) return res.status(404).json({ message: "Timetable entry not found." });
    res.json({ message: "Timetable entry deleted." });
  } catch { res.status(400).json({ message: "Could not delete timetable entry." }); }
});
module.exports = router;
