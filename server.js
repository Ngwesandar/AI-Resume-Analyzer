require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Resume = require("./models/Resume");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public")); // serve frontend files

const JWT_SECRET = process.env.JWT_SECRET;
// Make sure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch(err => console.log(err));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ─── TEST ROUTE ────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Server is running"));

// ─── REGISTER ─────────────────────────────────────────────────
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();

    res.json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── ANALYZE RESUME ───────────────────────────────────────────
app.post("/analyze-uploaded-resume", authMiddleware, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Skills to check
    const skillsList = [
      "JavaScript", "HTML", "CSS", "Node.js", "MongoDB",
      "React", "Express", "Python", "SQL", "Git",
      "TypeScript", "REST", "API", "Docker", "AWS"
    ];

    const foundSkills = skillsList.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    );

    const score = Math.min(100, foundSkills.length * 10);

    // Feedback based on score
    let feedback = "";
    if (score >= 80) feedback = "Excellent resume! Great skill set.";
    else if (score >= 50) feedback = "Good resume. Consider adding more technical skills.";
    else if (score >= 30) feedback = "Average resume. Add more relevant skills and experience.";
    else feedback = "Needs improvement. Expand your skills and experience sections.";

    // Save to MongoDB
    const resume = new Resume({
      userId: req.user.id,
      fileName: req.file.originalname,
      score,
      foundSkills,
      feedback,
      text: text.slice(0, 2000) // save first 2000 chars
    });
    await resume.save();

    fs.unlinkSync(filePath); // delete uploaded file

    res.json({ message: "Resume analyzed successfully", score, foundSkills, feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing PDF" });
  }
});

// ─── GET RESUME HISTORY ───────────────────────────────────────
app.get("/history", authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch history" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(3000, () => console.log("Server running on port 3000"));