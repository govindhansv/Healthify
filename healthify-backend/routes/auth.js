// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { signToken } = require('../lib/jwt');

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ email, password });
    await user.save();

    const token = signToken({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

    res.status(201).json({
      message: 'User created',
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.matchPassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DEV-ONLY: create an admin user. Remove or protect this in production.
router.post('/register-admin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, role: 'admin' });
    await user.save();

    const token = signToken(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      process.env.JWT_EXPIRES_IN,
    );

    return res.status(201).json({
      message: 'Admin user created',
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Register-admin error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
