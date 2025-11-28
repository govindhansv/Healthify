// healthify-backend/routes/meditations.js
const express = require('express');
const router = express.Router();
const Meditation = require('../models/meditation');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// @desc    Get all meditations (Public)
// @route   GET /api/meditations?page&limit&q&category
// @access  Public
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, q, category } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;
  const conditions = {};

  if (q) {
    conditions.title = { $regex: q, $options: 'i' };
  }
  if (category) {
    conditions.category = category;
  }

  try {
    const total = await Meditation.countDocuments(conditions);
    const meditations = await Meditation.find(conditions)
      .populate('category', 'name slug')
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
      data: meditations,
    });
  } catch (error) {
    console.error('List meditations error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// @desc    Get single meditation (Public)
// @route   GET /api/meditations/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const meditation = await Meditation.findById(req.params.id).populate('category', 'name slug');
    if (!meditation) {
      return res.status(404).json({ success: false, error: 'Meditation not found' });
    }
    res.status(200).json({ success: true, data: meditation });
  } catch (error) {
    console.error('Get meditation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// @desc    Create new meditation (Admin)
// @route   POST /api/meditations
// @access  Private/Admin
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const meditation = await Meditation.create(req.body);
    res.status(201).json({ success: true, data: meditation });
  } catch (error) {
    console.error('Create meditation error:', error);
    res.status(400).json({ success: false, error: error.message || 'Bad request' });
  }
});

// @desc    Update meditation (Admin)
// @route   PUT /api/meditations/:id
// @access  Private/Admin
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const meditation = await Meditation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!meditation) {
      return res.status(404).json({ success: false, error: 'Meditation not found' });
    }
    res.status(200).json({ success: true, data: meditation });
  } catch (error) {
    console.error('Update meditation error:', error);
    res.status(400).json({ success: false, error: error.message || 'Bad request' });
  }
});

// @desc    Delete meditation (Admin)
// @route   DELETE /api/meditations/:id
// @access  Private/Admin
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const meditation = await Meditation.findByIdAndDelete(req.params.id);
    if (!meditation) {
      return res.status(404).json({ success: false, error: 'Meditation not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete meditation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

module.exports = router;
