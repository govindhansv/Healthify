// routes/migration.js - Bulk import endpoints for data migration
const express = require('express');
const router = express.Router();
const slugify = require('slugify');

// Import models
const Category = require('../models/category');
const Exercise = require('../models/exercise');
const Nutrition = require('../models/nutrition');
const Medicine = require('../models/medicine');
const HealthQuestion = require('../models/healthQuestion');
const Meditation = require('../models/meditation');

/**
 * Helper to generate slug
 */
const generateSlug = (name) => slugify(name || '', { lower: true, strict: true });

/**
 * POST /api/migration/categories/bulk
 * Bulk import exercise categories
 */
router.post('/categories/bulk', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    const transformedData = data.map(item => ({
      name: item.name,
      slug: generateSlug(item.name),
      description: item.description || '',
      image: item.image || '',
      createdAt: item.created_at ? new Date(item.created_at) : new Date()
    }));

    const result = await Category.insertMany(transformedData, { ordered: false });
    res.json({
      success: true,
      imported: result.length,
      message: `Successfully imported ${result.length} categories`
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const imported = error.insertedDocs?.length || 0;
      return res.json({
        success: true,
        imported,
        skipped: error.writeErrors?.length || 0,
        message: `Imported ${imported} categories, some duplicates skipped`
      });
    }
    console.error('Category bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/exercises/bulk
 * Bulk import exercises
 */
router.post('/exercises/bulk', async (req, res) => {
  try {
    const { data, categoryMap } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    // categoryMap: { oldSupabaseId: newMongoId }
    const transformedData = data.map(item => ({
      title: item.name,
      slug: generateSlug(item.name),
      category: categoryMap?.[item.category_id] || null,
      description: item.description || '',
      instructions: '',
      difficulty: 'beginner',
      duration: item.duration || 0,
      equipment: [],
      image: item.image || '',
      video: item.video_url || '',
      createdAt: item.created_at ? new Date(item.created_at) : new Date()
    }));

    const result = await Exercise.insertMany(transformedData, { ordered: false });
    res.json({
      success: true,
      imported: result.length,
      message: `Successfully imported ${result.length} exercises`
    });
  } catch (error) {
    if (error.code === 11000) {
      const imported = error.insertedDocs?.length || 0;
      return res.json({
        success: true,
        imported,
        skipped: error.writeErrors?.length || 0,
        message: `Imported ${imported} exercises, some duplicates skipped`
      });
    }
    console.error('Exercise bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/nutrition/bulk
 * Bulk import nutrition items
 */
router.post('/nutrition/bulk', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    const transformedData = data.map(item => ({
      title: item.name,
      slug: generateSlug(item.name),
      description: item.description || '',
      type: 'Recipe',
      image: item.image || '',
      calories: item.calories || 0,
      ingredients: [],
      instructions: '',
      createdAt: item.created_at ? new Date(item.created_at) : new Date()
    }));

    const result = await Nutrition.insertMany(transformedData, { ordered: false });
    res.json({
      success: true,
      imported: result.length,
      message: `Successfully imported ${result.length} nutrition items`
    });
  } catch (error) {
    if (error.code === 11000) {
      const imported = error.insertedDocs?.length || 0;
      return res.json({
        success: true,
        imported,
        skipped: error.writeErrors?.length || 0,
        message: `Imported ${imported} nutrition items, some duplicates skipped`
      });
    }
    console.error('Nutrition bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/medicines/bulk
 * Bulk import medicines catalog
 */
router.post('/medicines/bulk', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    const transformedData = data.map(item => ({
      name: item.name,
      slug: generateSlug(item.name),
      dosage: item.default_dosage || '',
      unit: item.dosage_form || '',
      frequency: '',
      description: item.description || '',
      image: item.image || item.icon || '',
      createdAt: item.created_at ? new Date(item.created_at) : new Date()
    }));

    const result = await Medicine.insertMany(transformedData, { ordered: false });
    res.json({
      success: true,
      imported: result.length,
      message: `Successfully imported ${result.length} medicines`
    });
  } catch (error) {
    if (error.code === 11000) {
      const imported = error.insertedDocs?.length || 0;
      return res.json({
        success: true,
        imported,
        skipped: error.writeErrors?.length || 0,
        message: `Imported ${imported} medicines, some duplicates skipped`
      });
    }
    console.error('Medicine bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/questions/bulk
 * Bulk import health questions
 */
router.post('/questions/bulk', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    const transformedData = data.map((item, index) => ({
      category: item.category || 'Body',
      questionNumber: item.order || index + 1,
      questionText: item.question_text,
      options: Array.isArray(item.options) ? item.options : JSON.parse(item.options || '[]'),
      optionScores: [],
      isActive: true,
      order: item.order || index + 1,
      createdAt: item.created_at ? new Date(item.created_at) : new Date()
    }));

    const result = await HealthQuestion.insertMany(transformedData, { ordered: false });
    res.json({
      success: true,
      imported: result.length,
      message: `Successfully imported ${result.length} questions`
    });
  } catch (error) {
    if (error.code === 11000) {
      const imported = error.insertedDocs?.length || 0;
      return res.json({
        success: true,
        imported,
        skipped: error.writeErrors?.length || 0,
        message: `Imported ${imported} questions, some duplicates skipped`
      });
    }
    console.error('Question bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/meditations/bulk
 * Bulk import meditations
 */
router.post('/meditations/bulk', async (req, res) => {
  try {
    const { data, categoryMap } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Data array is required' });
    }

    // Need a default category for meditations
    let defaultCategory = null;
    const existingCategory = await Category.findOne({ name: /meditation/i });
    if (existingCategory) {
      defaultCategory = existingCategory._id;
    } else {
      const newCategory = await Category.create({
        name: 'Meditation',
        slug: 'meditation',
        description: 'Meditation sessions'
      });
      defaultCategory = newCategory._id;
    }

    const transformedData = data.map(item => ({
      title: item.title || item.name,
      slug: generateSlug(item.title || item.name),
      description: item.description || '',
      duration: item.duration || 300,
      category: categoryMap?.[item.category_id] || defaultCategory,
      audioUrl: item.audio_url || item.audioUrl || '',
      thumbnail: item.thumbnail || item.image || '',
      createdAt: item.created_at ? new Date(item.created_at) : new Date()
    }));

    const result = await Meditation.insertMany(transformedData, { ordered: false });
    res.json({
      success: true,
      imported: result.length,
      message: `Successfully imported ${result.length} meditations`
    });
  } catch (error) {
    if (error.code === 11000) {
      const imported = error.insertedDocs?.length || 0;
      return res.json({
        success: true,
        imported,
        skipped: error.writeErrors?.length || 0,
        message: `Imported ${imported} meditations, some duplicates skipped`
      });
    }
    console.error('Meditation bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/migration/status
 * Get current counts to verify migration
 */
router.get('/status', async (req, res) => {
  try {
    const [categories, exercises, nutrition, medicines, questions, meditations] = await Promise.all([
      Category.countDocuments(),
      Exercise.countDocuments(),
      Nutrition.countDocuments(),
      Medicine.countDocuments(),
      HealthQuestion.countDocuments(),
      Meditation.countDocuments()
    ]);

    res.json({
      categories,
      exercises,
      nutrition,
      medicines,
      questions,
      meditations
    });
  } catch (error) {
    console.error('Migration status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/fix-categories
 * Fix category mappings for exercises based on Supabase data
 * Expects: { mappings: [{ exerciseName: string, categoryName: string }] }
 */
router.post('/fix-categories', async (req, res) => {
  try {
    const { mappings } = req.body;
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({ error: 'Mappings array is required' });
    }

    // Get all categories from MongoDB
    const categories = await Category.find({});
    const categoryNameToId = {};
    categories.forEach(cat => {
      categoryNameToId[cat.name.toLowerCase()] = cat._id;
    });

    let updated = 0;
    let notFound = 0;
    let categoryNotFound = 0;

    for (const mapping of mappings) {
      const { exerciseName, categoryName } = mapping;

      if (!exerciseName || !categoryName) continue;

      // Find category by name (case-insensitive)
      const categoryId = categoryNameToId[categoryName.toLowerCase()];
      if (!categoryId) {
        categoryNotFound++;
        continue;
      }

      // Find exercise by title and update
      const result = await Exercise.findOneAndUpdate(
        { title: exerciseName },
        { category: categoryId },
        { new: true }
      );

      if (result) {
        updated++;
      } else {
        notFound++;
      }
    }

    res.json({
      success: true,
      updated,
      notFound,
      categoryNotFound,
      message: `Updated ${updated} exercises with categories`
    });
  } catch (error) {
    console.error('Fix categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/migration/unassigned-exercises
 * Get list of exercises without categories
 */
router.get('/unassigned-exercises', async (req, res) => {
  try {
    const total = await Exercise.countDocuments();
    const unassignedExercises = await Exercise.find({ category: null })
      .select('title slug _id')
      .lean();
    const assigned = total - unassignedExercises.length;

    res.json({
      total,
      assigned,
      unassigned: unassignedExercises.length,
      exercises: unassignedExercises
    });
  } catch (error) {
    console.error('Unassigned exercises error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/migration/assign-unassigned-to-category
 * Assign all unassigned exercises to a specific category
 * Expects: { categoryName: string } (defaults to "Yoga")
 */
router.post('/assign-unassigned-to-category', async (req, res) => {
  try {
    const { categoryName = 'Yoga' } = req.body;

    // Find the category
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    });

    if (!category) {
      return res.status(404).json({ error: `Category "${categoryName}" not found` });
    }

    // Update all exercises without a category
    const result = await Exercise.updateMany(
      { category: null },
      { category: category._id }
    );

    res.json({
      success: true,
      updated: result.modifiedCount,
      categoryName: category.name,
      message: `Assigned ${result.modifiedCount} exercises to "${category.name}" category`
    });
  } catch (error) {
    console.error('Assign unassigned error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



