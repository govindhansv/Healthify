const express = require('express');
const router = express.Router();
const Faq = require('../models/faq');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// GET /api/faqs?category=Account
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const data = await Faq.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(data);
  } catch (err) {
    console.error('List faqs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/faqs (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { question, answer, category, order } = req.body || {};
    if (!question) return res.status(400).json({ message: 'Question required' });

    const exists = await Faq.findOne({ question: question.trim() });
    if (exists) return res.status(400).json({ message: 'FAQ already exists' });

    const faq = new Faq({
      question: question.trim(),
      answer: answer || '',
      category: category || '',
      order: typeof order === 'number' ? order : Number(order) || 0
    });

    await faq.save();
    res.status(201).json({ message: 'FAQ created', faq });
  } catch (err) {
    console.error('Create faq error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'FAQ with this question already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/faqs/:id (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { question, answer, category, order } = req.body || {};
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    if (question) faq.question = question.trim();
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (order !== undefined) faq.order = typeof order === 'number' ? order : Number(order) || 0;

    await faq.save();
    res.json({ message: 'FAQ updated', faq });
  } catch (err) {
    console.error('Update faq error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'FAQ with this question already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/faqs/:id (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    console.error('Delete faq error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
