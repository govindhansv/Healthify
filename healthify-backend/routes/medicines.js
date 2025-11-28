const express = require('express');
const router = express.Router();
const Medicine = require('../models/medicine');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// GET /api/medicines?page=1&limit=10&q=term
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const q = (req.query.q || '').trim();
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await Medicine.countDocuments(filter);
    const data = await Medicine.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ page, limit, total, pages: Math.ceil(total / limit), data });
  } catch (err) {
    console.error('List medicines error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/medicines (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { name, dosage, unit, frequency, description, image, user } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Name required' });

    const exists = await Medicine.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: 'Medicine already exists' });

    const med = new Medicine({
      name: name.trim(),
      dosage: dosage || '',
      unit: unit || '',
      frequency: frequency || '',
      description: description || '',
      image: image || '',
      user: user || undefined
    });

    await med.save();
    res.status(201).json({ message: 'Medicine created', medicine: med });
  } catch (err) {
    console.error('Create medicine error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Medicine with this name already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/medicines/:id (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { name, dosage, unit, frequency, description, image, user } = req.body || {};
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medicine not found' });

    if (name) med.name = name.trim();
    if (dosage !== undefined) med.dosage = dosage;
    if (unit !== undefined) med.unit = unit;
    if (frequency !== undefined) med.frequency = frequency;
    if (description !== undefined) med.description = description;
    if (image !== undefined) med.image = image;
    if (user !== undefined) med.user = user || undefined;

    await med.save();
    res.json({ message: 'Medicine updated', medicine: med });
  } catch (err) {
    console.error('Update medicine error:', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Medicine with this name already exists' });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/medicines/:id (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const med = await Medicine.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.json({ message: 'Medicine deleted' });
  } catch (err) {
    console.error('Delete medicine error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
