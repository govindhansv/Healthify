const express = require("express");
const router = express.Router();
const Workout = require("../models/workout");
const Exercise = require("../models/exercise");
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/isAdmin");

// GET /api/workouts?page=1&limit=10&q=term&difficulty=&category=
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const q = (req.query.q || "").trim();
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ];
    }
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    // optional: filter by category (workout contains any exercise from this category)
    if (req.query.category) {
      // find exercises in that category and filter workouts with those exercise ids
      const exIds = await Exercise.find({ category: req.query.category }).distinct("_id");
      filter.exercises = { $in: exIds };
    }

    const total = await Workout.countDocuments(filter);
    const data = await Workout.find(filter)
      .populate({ path: "exercises", select: "title duration difficulty" })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ page, limit, total, pages: Math.ceil(total / limit), data });
  } catch (err) {
    console.error("List workouts error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/workouts/:id
router.get("/:id", async (req, res) => {
  try {
    const w = await Workout.findById(req.params.id).populate({ path: "exercises", select: "title duration difficulty" });
    if (!w) return res.status(404).json({ message: "Workout not found" });
    res.json(w);
  } catch (err) {
    console.error("Get workout error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/workouts (admin)
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { name, description, difficulty, exercises, thumbnail } = req.body || {};
    if (!name) return res.status(400).json({ message: "Name required" });

    // validate exercise ids if provided
    let exList = [];
    if (exercises && Array.isArray(exercises) && exercises.length) {
      // ensure all exist
      const found = await Exercise.find({ _id: { $in: exercises } }).select("_id duration").lean();
      if (found.length !== exercises.length) {
        return res.status(400).json({ message: "One or more exercises not found" });
      }
      exList = exercises;
    }

    const exists = await Workout.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: "Workout already exists" });

    const w = new Workout({
      name: name.trim(),
      description: description || "",
      difficulty: difficulty || "beginner",
      exercises: exList,
      thumbnail: thumbnail || ""
    });

    await w.save();
    const populated = await Workout.findById(w._id).populate({ path: "exercises", select: "title duration difficulty" });
    res.status(201).json({ message: "Workout created", workout: populated });
  } catch (err) {
    console.error("Create workout error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Workout with this name already exists" });
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/workouts/:id (admin)
router.put("/:id", protect, isAdmin, async (req, res) => {
  try {
    const { name, description, difficulty, exercises, thumbnail } = req.body || {};
    const w = await Workout.findById(req.params.id);
    if (!w) return res.status(404).json({ message: "Workout not found" });

    if (name) w.name = name.trim();
    if (description !== undefined) w.description = description;
    if (difficulty !== undefined) w.difficulty = difficulty;
    if (thumbnail !== undefined) w.thumbnail = thumbnail;

    if (exercises !== undefined) {
      if (exercises && exercises.length) {
        const found = await Exercise.find({ _id: { $in: exercises } }).select("_id duration").lean();
        if (found.length !== exercises.length) {
          return res.status(400).json({ message: "One or more exercises not found" });
        }
        w.exercises = exercises;
      } else {
        w.exercises = [];
      }
    }

    await w.save();
    const populated = await Workout.findById(w._id).populate({ path: "exercises", select: "title duration difficulty" });
    res.json({ message: "Workout updated", workout: populated });
  } catch (err) {
    console.error("Update workout error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Workout with this name already exists" });
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/workouts/:id (admin)
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const w = await Workout.findByIdAndDelete(req.params.id);
    if (!w) return res.status(404).json({ message: "Workout not found" });
    res.json({ message: "Workout deleted" });
  } catch (err) {
    console.error("Delete workout error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
