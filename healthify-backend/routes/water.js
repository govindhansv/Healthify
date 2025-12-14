// routes/water.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const WaterLog = require('../models/waterLog');
const { protect } = require('../middleware/auth');

/**
 * Helper: Get today's date in YYYY-MM-DD format (based on server timezone)
 * For production, you might want to accept timezone from client
 */
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Helper: Get or create today's water log for a user
 */
async function getOrCreateTodayLog(userId, userGoal) {
    const today = getTodayDate();

    let log = await WaterLog.findOne({ user: userId, date: today });

    if (!log) {
        log = new WaterLog({
            user: userId,
            date: today,
            count: 0,
            goal: userGoal || 8
        });
        await log.save();
    }

    return log;
}

/**
 * @desc    Get user's water goal setting
 * @route   GET /api/water/goal
 * @access  Private (User)
 */
router.get('/goal', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('waterGoal');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                waterGoal: user.waterGoal || 8
            }
        });
    } catch (error) {
        console.error('Get water goal error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Set user's water goal
 * @route   PUT /api/water/goal
 * @access  Private (User)
 * @body    { goal: number (1-20) }
 */
router.put('/goal', protect, async (req, res) => {
    try {
        const { goal } = req.body || {};

        if (!goal || goal < 1 || goal > 20) {
            return res.status(400).json({
                success: false,
                message: 'Goal must be between 1 and 20 glasses'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.waterGoal = Math.round(goal);
        user.updatedAt = new Date();
        await user.save();

        // Also update today's log goal if it exists
        const today = getTodayDate();
        await WaterLog.updateOne(
            { user: req.user.id, date: today },
            { goal: user.waterGoal, updatedAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: 'Water goal updated',
            data: {
                waterGoal: user.waterGoal
            }
        });
    } catch (error) {
        console.error('Set water goal error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get today's water intake progress
 * @route   GET /api/water/today
 * @access  Private (User)
 */
router.get('/today', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('waterGoal');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const log = await getOrCreateTodayLog(req.user.id, user.waterGoal);
        const percentage = log.goal > 0 ? Math.min(Math.round((log.count / log.goal) * 100), 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                date: log.date,
                count: log.count,
                goal: log.goal,
                percentage: percentage,
                remaining: Math.max(log.goal - log.count, 0),
                completed: log.count >= log.goal
            }
        });
    } catch (error) {
        console.error('Get today water error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Add one glass of water (increment by 1)
 * @route   POST /api/water/drink
 * @access  Private (User)
 */
router.post('/drink', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const log = await getOrCreateTodayLog(req.user.id, user.waterGoal);

        log.count += 1;
        log.updatedAt = new Date();
        await log.save();

        // Sync to User model (Fire and Forget)
        user.currentWater = {
            date: log.date,
            count: log.count
        };
        user.save().catch(e => console.error('BG Sync failed:', e));

        const percentage = log.goal > 0 ? Math.min(Math.round((log.count / log.goal) * 100), 100) : 0;

        res.status(200).json({
            success: true,
            message: 'Water intake recorded',
            data: {
                date: log.date,
                count: log.count,
                goal: log.goal,
                percentage: percentage,
                remaining: Math.max(log.goal - log.count, 0),
                completed: log.count >= log.goal
            }
        });
    } catch (error) {
        console.error('Add water error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Remove one glass of water (decrement by 1)
 * @route   DELETE /api/water/drink
 * @access  Private (User)
 */
router.delete('/drink', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const log = await getOrCreateTodayLog(req.user.id, user.waterGoal);

        log.count = Math.max(log.count - 1, 0);
        log.updatedAt = new Date();
        await log.save();

        // Sync to User model (Fire and Forget)
        user.currentWater = {
            date: log.date,
            count: log.count
        };
        user.save().catch(e => console.error('BG Sync failed:', e));

        const percentage = log.goal > 0 ? Math.min(Math.round((log.count / log.goal) * 100), 100) : 0;

        res.status(200).json({
            success: true,
            message: 'Water intake reduced',
            data: {
                date: log.date,
                count: log.count,
                goal: log.goal,
                percentage: percentage,
                remaining: Math.max(log.goal - log.count, 0),
                completed: log.count >= log.goal
            }
        });
    } catch (error) {
        console.error('Remove water error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Set water count to a specific value
 * @route   PUT /api/water/today
 * @access  Private (User)
 * @body    { count: number }
 */
router.put('/today', protect, async (req, res) => {
    try {
        const { count } = req.body || {};

        if (count === undefined || count < 0) {
            return res.status(400).json({
                success: false,
                message: 'Count must be 0 or greater'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const log = await getOrCreateTodayLog(req.user.id, user.waterGoal);

        log.count = Math.round(count);
        log.updatedAt = new Date();
        await log.save();

        // Sync to User model (Fire and Forget)
        user.currentWater = {
            date: log.date,
            count: log.count
        };
        user.save().catch(e => console.error('BG Sync failed:', e));

        const percentage = log.goal > 0 ? Math.min(Math.round((log.count / log.goal) * 100), 100) : 0;

        res.status(200).json({
            success: true,
            message: 'Water intake updated',
            data: {
                date: log.date,
                count: log.count,
                goal: log.goal,
                percentage: percentage,
                remaining: Math.max(log.goal - log.count, 0),
                completed: log.count >= log.goal
            }
        });
    } catch (error) {
        console.error('Set water count error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get water intake history for calendar/graph view
 * @route   GET /api/water/history
 * @access  Private (User)
 * @query   { startDate?: YYYY-MM-DD, endDate?: YYYY-MM-DD, days?: number }
 * 
 * If no params: returns last 30 days
 * If days=7: returns last 7 days
 * If startDate & endDate: returns that range
 */
router.get('/history', protect, async (req, res) => {
    try {
        const { startDate, endDate, days } = req.query;

        let start, end;

        if (startDate && endDate) {
            // Use provided date range
            start = startDate;
            end = endDate;
        } else {
            // Calculate based on 'days' param or default to 30
            const numDays = parseInt(days) || 30;
            const endDateObj = new Date();
            const startDateObj = new Date();
            startDateObj.setDate(endDateObj.getDate() - numDays + 1);

            start = startDateObj.toISOString().split('T')[0];
            end = endDateObj.toISOString().split('T')[0];
        }

        // Fetch logs in date range
        const logs = await WaterLog.find({
            user: req.user.id,
            date: { $gte: start, $lte: end }
        })
            .select('date count goal')
            .sort({ date: 1 })
            .lean();

        // Create a map for quick lookup
        const logMap = {};
        logs.forEach(log => {
            logMap[log.date] = {
                date: log.date,
                count: log.count,
                goal: log.goal,
                percentage: log.goal > 0 ? Math.min(Math.round((log.count / log.goal) * 100), 100) : 0,
                completed: log.count >= log.goal
            };
        });

        // Generate all dates in range and fill in missing days with count: 0
        const history = [];
        const currentDate = new Date(start);
        const endDateObj = new Date(end);

        // Get user's current goal for days without logs
        const user = await User.findById(req.user.id).select('waterGoal');
        const defaultGoal = user?.waterGoal || 8;

        while (currentDate <= endDateObj) {
            const dateStr = currentDate.toISOString().split('T')[0];

            if (logMap[dateStr]) {
                history.push(logMap[dateStr]);
            } else {
                history.push({
                    date: dateStr,
                    count: 0,
                    goal: defaultGoal,
                    percentage: 0,
                    completed: false
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate summary stats
        const totalDays = history.length;
        const daysWithData = logs.length;
        const completedDays = history.filter(h => h.completed).length;
        const totalGlasses = history.reduce((sum, h) => sum + h.count, 0);
        const averagePerDay = daysWithData > 0
            ? Math.round((logs.reduce((sum, l) => sum + l.count, 0) / daysWithData) * 10) / 10
            : 0;

        res.status(200).json({
            success: true,
            data: {
                history: history,
                summary: {
                    startDate: start,
                    endDate: end,
                    totalDays: totalDays,
                    daysWithData: daysWithData,
                    completedDays: completedDays,
                    completionRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
                    totalGlasses: totalGlasses,
                    averagePerDay: averagePerDay
                }
            }
        });
    } catch (error) {
        console.error('Get water history error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get specific date's water intake
 * @route   GET /api/water/date/:date
 * @access  Private (User)
 * @param   date - YYYY-MM-DD format
 */
router.get('/date/:date', protect, async (req, res) => {
    try {
        const { date } = req.params;

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const user = await User.findById(req.user.id).select('waterGoal');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const log = await WaterLog.findOne({ user: req.user.id, date: date });

        if (!log) {
            return res.status(200).json({
                success: true,
                data: {
                    date: date,
                    count: 0,
                    goal: user.waterGoal || 8,
                    percentage: 0,
                    remaining: user.waterGoal || 8,
                    completed: false,
                    exists: false
                }
            });
        }

        const percentage = log.goal > 0 ? Math.min(Math.round((log.count / log.goal) * 100), 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                date: log.date,
                count: log.count,
                goal: log.goal,
                percentage: percentage,
                remaining: Math.max(log.goal - log.count, 0),
                completed: log.count >= log.goal,
                exists: true
            }
        });
    } catch (error) {
        console.error('Get date water error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
