// routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { protect } = require('../middleware/auth');

/**
 * @desc    Get current user's profile
 * @route   GET /api/profile
 * @access  Private (User)
 */
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                name: user.name || '',
                age: user.age || null,
                gender: user.gender || '',
                weight: user.weight || null,
                height: user.height || null,
                profileImage: user.profileImage || '',
                profileCompleted: user.profileCompleted || false,
                role: user.role,
                healthMetrics: user.healthMetrics || {
                    cholesterol: { value: '', unit: 'mg/dL' },
                    bloodSugar: { value: '', unit: 'mg/dL', type: 'fasting' },
                    bloodPressure: { value: '', systolic: null, diastolic: null }
                },
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Complete profile (initial setup after registration)
 * @route   POST /api/profile/complete
 * @access  Private (User)
 * @body    { name, age, gender, weight, height? }
 */
router.post('/complete', protect, async (req, res) => {
    try {
        const { name, age, gender, weight, height } = req.body || {};

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        if (!age || age < 1 || age > 150) {
            return res.status(400).json({ success: false, message: 'Valid age is required (1-150)' });
        }
        if (!gender || !['male', 'female', 'other'].includes(gender.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Gender is required (male, female, or other)' });
        }
        if (!weight || weight < 1) {
            return res.status(400).json({ success: false, message: 'Valid weight is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update profile fields
        user.name = name.trim();
        user.age = Number(age);
        user.gender = gender.toLowerCase();
        user.weight = Number(weight);
        if (height) user.height = Number(height);
        user.profileCompleted = true;
        user.updatedAt = new Date();

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile completed successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                gender: user.gender,
                weight: user.weight,
                height: user.height || null,
                profileImage: user.profileImage || '',
                profileCompleted: user.profileCompleted,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Complete profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update profile (edit from profile page)
 * @route   PUT /api/profile
 * @access  Private (User)
 * @body    { name?, age?, gender?, weight?, height?, profileImage? }
 */
router.put('/', protect, async (req, res) => {
    try {
        const { name, age, gender, weight, height, profileImage } = req.body || {};

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update only provided fields
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Name cannot be empty' });
            }
            user.name = name.trim();
        }

        if (age !== undefined) {
            const ageNum = Number(age);
            if (ageNum < 1 || ageNum > 150) {
                return res.status(400).json({ success: false, message: 'Age must be between 1 and 150' });
            }
            user.age = ageNum;
        }

        if (gender !== undefined) {
            if (!['male', 'female', 'other', ''].includes(gender.toLowerCase())) {
                return res.status(400).json({ success: false, message: 'Invalid gender value' });
            }
            user.gender = gender.toLowerCase();
        }

        if (weight !== undefined) {
            const weightNum = Number(weight);
            if (weightNum < 1) {
                return res.status(400).json({ success: false, message: 'Weight must be positive' });
            }
            user.weight = weightNum;
        }

        if (height !== undefined) {
            const heightNum = Number(height);
            if (heightNum < 1) {
                return res.status(400).json({ success: false, message: 'Height must be positive' });
            }
            user.height = heightNum;
        }

        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                gender: user.gender,
                weight: user.weight,
                height: user.height || null,
                profileImage: user.profileImage || '',
                profileCompleted: user.profileCompleted,
                role: user.role,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Upload/Update profile image
 * @route   PUT /api/profile/image
 * @access  Private (User)
 * @body    { profileImage: "url" }
 */
router.put('/image', protect, async (req, res) => {
    try {
        const { profileImage } = req.body || {};

        if (!profileImage) {
            return res.status(400).json({ success: false, message: 'Profile image URL is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.profileImage = profileImage;
        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: {
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Check if profile is completed
 * @route   GET /api/profile/status
 * @access  Private (User)
 */
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('profileCompleted');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                profileCompleted: user.profileCompleted || false
            }
        });
    } catch (error) {
        console.error('Check profile status error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
