// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/user'); // adjust path if your model is User.js
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

// Helper: build filter for search (q matches email)
function buildFilter(q) {
  if (!q) return {};
  return { email: { $regex: q, $options: 'i' } };
}

// GET /api/admin/users
// query: ?page=1&limit=10&q=search
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const q = req.query.q || '';

    const filter = buildFilter(q);

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')                // never return password
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id  (update user fields; password handled safely)
router.put('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    const user = await User.findById(req.params.id).select('+password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Allowed fields to update
    const allowed = ['email', 'password', 'role'];
    allowed.forEach(f => {
      if (updates[f] !== undefined) user[f] = updates[f];
    });

    // If password changed, the pre-save hook in User model will hash it
    await user.save();

    const out = user.toObject();
    delete out.password;
    res.json({ message: 'User updated', user: out });
  } catch (err) {
    console.error('Admin update user error:', err);
    // handle duplicate email error gracefully
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
