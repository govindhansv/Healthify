const express = require('express');
const router = express.Router();
const Nutrition = require('../models/nutrition');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// GET /api/nutrition?page=1&limit=10&q=term&type=Recipe
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

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const total = await Nutrition.countDocuments(filter);
    const data = await Nutrition.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ page, limit, total, pages: Math.ceil(total / limit), data });
  } catch (err) {
    console.error('List nutrition error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/nutrition/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Nutrition.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Nutrition item not found' });
    res.json(item);
  } catch (err) {
    console.error('Get nutrition error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/nutrition (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { title, description, type, image, calories, ingredients, instructions } = req.body || {};
    if (!title) return res.status(400).json({ message: 'Title required' });

    const exists = await Nutrition.findOne({ title: title.trim() });
    if (exists) return res.status(400).json({ message: 'Nutrition item already exists' });

    const item = new Nutrition({
      title: title.trim(),
      description: description || '',
      type: type || 'Recipe',
      image: image || '',
      calories: typeof calories === 'number' ? calories : Number(calories) || 0,
      ingredients: Array.isArray(ingredients)
        ? ingredients
        : (ingredients ? [ingredients] : []),
      instructions: instructions || ''
    });

    await item.save();
    res.status(201).json({ message: 'Nutrition item created', nutrition: item });
  } catch (err) {
    console.error('Create nutrition error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Nutrition item with this title already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/nutrition/:id (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { title, description, type, image, calories, ingredients, instructions } = req.body || {};
    const item = await Nutrition.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Nutrition item not found' });

    if (title) item.title = title.trim();
    if (description !== undefined) item.description = description;
    if (type !== undefined) item.type = type;
    if (image !== undefined) item.image = image;
    if (calories !== undefined) item.calories = typeof calories === 'number' ? calories : Number(calories) || 0;
    if (ingredients !== undefined) {
      item.ingredients = Array.isArray(ingredients)
        ? ingredients
        : (ingredients ? [ingredients] : []);
    }
    if (instructions !== undefined) item.instructions = instructions;

    await item.save();
    res.json({ message: 'Nutrition item updated', nutrition: item });
  } catch (err) {
    console.error('Update nutrition error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Nutrition item with this title already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/nutrition/:id (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const item = await Nutrition.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Nutrition item not found' });
    res.json({ message: 'Nutrition item deleted' });
  } catch (err) {
    console.error('Delete nutrition error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
