// routes/adminSummary.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { isAdmin } = require("../middleware/isAdmin");

// Concrete models
const User = require("../models/user");
const Category = require("../models/category");
const Exercise = require("../models/exercise");
const Workout = require("../models/workout");
const Meditation = require("../models/meditation");
const Nutrition = require("../models/nutrition");
const Medicine = require("../models/medicine");
const Faq = require("../models/faq");

function safeCount(model) {
  return model.countDocuments().catch(err => {
    console.error("Admin summary count error:", model.modelName, err);
    return 0;
  });
}

// GET /api/admin/summary
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    // Build promises for counts; if model missing or count fails, return 0
    const pUsers = safeCount(User);
    const pCategories = safeCount(Category);
    const pExercises = safeCount(Exercise);
    const pWorkouts = safeCount(Workout);
    const pMeditations = safeCount(Meditation);
    const pNutrition = safeCount(Nutrition);
    const pMedicines = safeCount(Medicine);
    const pFaqs = safeCount(Faq);

    const [
      users,
      categories,
      exercises,
      workouts,
      meditations,
      nutrition,
      medicines,
      faqs
    ] = await Promise.all([
      pUsers,
      pCategories,
      pExercises,
      pWorkouts,
      pMeditations,
      pNutrition,
      pMedicines,
      pFaqs
    ]);

    res.json({
      users,
      categories,
      exercises,
      workouts,
      meditations,
      nutrition,
      medicines,
      faqs,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
