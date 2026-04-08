const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fileName: String,
  score: Number,
  foundSkills: [String],
  feedback: String,
  text: String
}, { timestamps: true });

module.exports = mongoose.model("Resume", resumeSchema);