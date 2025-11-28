const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Exercise = require('../models/exercise');
const Category = require('../models/category');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// GET /api/exercises?page=1&limit=10&q=term&category=<id>&difficulty=beginner
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const q = (req.query.q || '').trim();
    const filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const total = await Exercise.countDocuments(filter);
    const data = await Exercise.find(filter)
      .populate('category', 'name slug')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ page, limit, total, pages: Math.ceil(total / limit), data });
  } catch (err) {
    console.error('List exercises error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/exercises/:id
router.get('/:id', async (req, res) => {
  try {
    const ex = await Exercise.findById(req.params.id).populate('category', 'name slug');
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });
    res.json(ex);
  } catch (err) {
    console.error('Get exercise error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/exercises (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { title, category, description, difficulty, duration, equipment, image } = req.body || {};
    if (!title) return res.status(400).json({ message: 'Title required' });

    const exists = await Exercise.findOne({ title: title.trim() });
    if (exists) return res.status(400).json({ message: 'Exercise already exists' });

    let cat = null;
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: 'Invalid category id' });
      }
      cat = await Category.findById(category);
      if (!cat) return res.status(400).json({ message: 'Category not found' });
    }

    const ex = new Exercise({
      title: title.trim(),
      category: cat ? cat._id : undefined,
      description: description || '',
      difficulty: difficulty || 'beginner',
      duration: Number(duration) || 0,
      equipment: Array.isArray(equipment) ? equipment : (equipment ? [equipment] : []),
      image: image || ''
    });

    await ex.save();
    await ex.populate('category', 'name slug');
    res.status(201).json({ message: 'Exercise created', exercise: ex });
  } catch (err) {
    console.error('Create exercise error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Exercise with this title already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/exercises/:id (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { title, category, description, difficulty, duration, equipment, image } = req.body || {};
    const ex = await Exercise.findById(req.params.id);
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });

    if (title) ex.title = title.trim();
    if (category !== undefined) {
      if (category) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          return res.status(400).json({ message: 'Invalid category id' });
        }
        const cat = await Category.findById(category);
        if (!cat) return res.status(400).json({ message: 'Category not found' });
        ex.category = cat._id;
      } else {
        ex.category = undefined;
      }
    }
    if (description !== undefined) ex.description = description;
    if (difficulty !== undefined) ex.difficulty = difficulty;
    if (duration !== undefined) ex.duration = Number(duration) || 0;
    if (equipment !== undefined) ex.equipment = Array.isArray(equipment) ? equipment : (equipment ? [equipment] : []);
    if (image !== undefined) ex.image = image;

    await ex.save();
    await ex.populate('category', 'name slug');
    res.json({ message: 'Exercise updated', exercise: ex });
  } catch (err) {
    console.error('Update exercise error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Exercise with this title already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/exercises/:id (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const ex = await Exercise.findByIdAndDelete(req.params.id);
    if (!ex) return res.status(404).json({ message: 'Exercise not found' });
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    console.error('Delete exercise error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
