const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 100 },
  day: { type: String, required: true, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, trim: true, maxlength: 100, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Schedule", scheduleSchema);
