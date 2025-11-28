const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// List (page, limit, q)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const q = (req.query.q || '').trim();
    const filter = q ? { $or: [
      { name: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ] } : {};
    const total = await Category.countDocuments(filter);
    const data = await Category.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json({ page, limit, total, pages: Math.ceil(total/limit), data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single
router.get('/:id', async (req, res) => {
  try {
    const c = await Category.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { name, description, image } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Name required' });
    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: 'Category already exists' });
    const category = new Category({ name: name.trim(), description: description || '', image: image || '' });
    await category.save();
    res.status(201).json({ message: 'Category created', category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { name, description, image } = req.body || {};
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) return res.status(400).json({ message: 'Category with this name exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
