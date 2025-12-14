// routes/healthMetrics.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { protect } = require('../middleware/auth');

/**
 * @desc    Get current user's health metrics
 * @route   GET /api/health-metrics
 * @access  Private (User)
 */
router.get('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const metrics = user.healthMetrics || {};

        res.status(200).json({
            success: true,
            data: {
                cholesterol: metrics.cholesterol?.value || '',
                cholesterolUnit: metrics.cholesterol?.unit || 'mg/dL',
                bloodSugar: metrics.bloodSugar?.value || '',
                bloodSugarUnit: metrics.bloodSugar?.unit || 'mg/dL',
                bloodSugarType: metrics.bloodSugar?.type || 'fasting',
                bloodPressure: metrics.bloodPressure?.value || '',
                systolic: metrics.bloodPressure?.systolic || null,
                diastolic: metrics.bloodPressure?.diastolic || null,
                updatedAt: metrics.updatedAt || user.updatedAt
            }
        });
    } catch (error) {
        console.error('Get health metrics error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update health metrics
 * @route   PUT /api/health-metrics
 * @access  Private (User)
 */
router.put('/', protect, async (req, res) => {
    try {
        const { cholesterol, bloodSugar, bloodPressure } = req.body || {};
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Initialize healthMetrics if it doesn't exist
        if (!user.healthMetrics) {
            user.healthMetrics = {};
        }

        // Update cholesterol if provided
        if (cholesterol !== undefined) {
            const val = cholesterol.trim().replace(/^Not set$/i, '');
            user.healthMetrics.cholesterol = {
                value: val,
                unit: 'mg/dL',
                updatedAt: new Date()
            };
        }

        // Update blood sugar if provided
        if (bloodSugar !== undefined) {
            const val = bloodSugar.trim().replace(/^Not set$/i, '');
            user.healthMetrics.bloodSugar = {
                value: val,
                unit: 'mg/dL',
                type: 'fasting',
                updatedAt: new Date()
            };
        }

        // Update blood pressure if provided
        if (bloodPressure !== undefined) {
            const val = bloodPressure.trim().replace(/^Not set$/i, '');
            let systolic = null;
            let diastolic = null;

            if (val && val.includes('/')) {
                const parts = val.split('/');
                systolic = parseInt(parts[0]) || null;
                diastolic = parseInt(parts[1]) || null;
            }

            user.healthMetrics.bloodPressure = {
                value: val,
                systolic,
                diastolic,
                updatedAt: new Date()
            };
        }

        await user.save();
        const metrics = user.healthMetrics;

        res.status(200).json({
            success: true,
            message: 'Health metrics updated successfully',
            data: {
                cholesterol: metrics.cholesterol?.value || '',
                cholesterolUnit: metrics.cholesterol?.unit || 'mg/dL',
                bloodSugar: metrics.bloodSugar?.value || '',
                bloodSugarUnit: metrics.bloodSugar?.unit || 'mg/dL',
                bloodSugarType: metrics.bloodSugar?.type || 'fasting',
                bloodPressure: metrics.bloodPressure?.value || '',
                systolic: metrics.bloodPressure?.systolic || null,
                diastolic: metrics.bloodPressure?.diastolic || null,
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Update health metrics error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update individual metric
 * @route   PATCH /api/health-metrics/:type
 * @access  Private (User)
 */
router.patch('/:type', protect, async (req, res) => {
    try {
        const { type } = req.params;
        const { value } = req.body || {};

        if (!['cholesterol', 'bloodSugar', 'bloodPressure'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metric type. Must be cholesterol, bloodSugar, or bloodPressure'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.healthMetrics) user.healthMetrics = {};

        const cleanValue = (value || '').trim().replace(/^Not set$/i, '');

        switch (type) {
            case 'cholesterol':
                user.healthMetrics.cholesterol = {
                    value: cleanValue,
                    unit: 'mg/dL',
                    updatedAt: new Date()
                };
                break;
            case 'bloodSugar':
                user.healthMetrics.bloodSugar = {
                    value: cleanValue,
                    unit: 'mg/dL',
                    type: 'fasting',
                    updatedAt: new Date()
                };
                break;
            case 'bloodPressure':
                let systolic = null;
                let diastolic = null;
                if (cleanValue && cleanValue.includes('/')) {
                    const parts = cleanValue.split('/');
                    systolic = parseInt(parts[0]) || null;
                    diastolic = parseInt(parts[1]) || null;
                }
                user.healthMetrics.bloodPressure = {
                    value: cleanValue,
                    systolic,
                    diastolic,
                    updatedAt: new Date()
                };
                break;
        }

        await user.save();
        const metrics = user.healthMetrics;

        res.status(200).json({
            success: true,
            message: `${type} updated successfully`,
            data: {
                [type]: metrics[type]?.value || ''
            }
        });
    } catch (error) {
        console.error('Update individual metric error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
