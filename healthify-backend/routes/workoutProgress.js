// routes/workoutProgress.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WorkoutSession = require('../models/workoutSession');
const ExerciseBundle = require('../models/exerciseBundle');
const Exercise = require('../models/exercise');
const { protect } = require('../middleware/auth');

/**
 * Helper: Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * @desc    Start a workout session from a program day
 * @route   POST /api/workout-progress/start
 * @access  Private (User)
 * @body    { programId, day } or { workoutId }
 */
router.post('/start', protect, async (req, res) => {
    try {
        const { programId, day, workoutId } = req.body || {};

        let exercises = [];
        let title = 'Workout Session';
        let sessionData = {
            user: req.user.id,
            date: getTodayDate(),
            status: 'in_progress',
            startedAt: new Date()
        };

        // Start from program day
        if (programId && day) {
            if (!mongoose.Types.ObjectId.isValid(programId)) {
                return res.status(400).json({ success: false, message: 'Invalid program ID' });
            }

            const program = await ExerciseBundle.findById(programId)
                .populate('schedule.exercises.exercise', 'title slug image gif video difficulty duration description equipment');

            if (!program) {
                return res.status(404).json({ success: false, message: 'Program not found' });
            }

            const dayData = program.schedule.find(d => d.day === day);
            if (!dayData) {
                return res.status(404).json({ success: false, message: `Day ${day} not found in program` });
            }

            if (dayData.isRestDay) {
                return res.status(400).json({ success: false, message: 'This is a rest day' });
            }

            sessionData.program = programId;
            sessionData.programDay = day;
            sessionData.programDayTitle = dayData.title || `Day ${day}`;
            title = `${program.name} - ${dayData.title || `Day ${day}`}`;

            // Map exercises with order - filter out any null exercises (deleted from DB)
            exercises = dayData.exercises
                .filter(ex => ex.exercise && ex.exercise._id)
                .map((ex, index) => ({
                    exercise: ex.exercise._id,
                    targetReps: ex.reps,
                    targetSets: ex.sets,
                    completedReps: 0,
                    completedSets: 0,
                    duration: ex.duration || 0,
                    restTime: 0,
                    status: 'pending',
                    order: index
                }));
        }
        // TODO: Support standalone workout

        // Debug logging
        console.log(`Start workout - Day ${day}, exercises to start: ${exercises.length}`);

        if (exercises.length === 0) {
            return res.status(400).json({
                success: false,
                message: `No exercises found for Day ${day}. Please add exercises to this day in the admin panel.`
            });
        }

        // Check if user already has an active session today
        const existingActive = await WorkoutSession.findOne({
            user: req.user.id,
            date: getTodayDate(),
            status: { $in: ['in_progress', 'paused'] }
        });

        if (existingActive) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active workout session',
                data: { sessionId: existingActive._id }
            });
        }

        sessionData.title = title;
        sessionData.exercises = exercises;
        sessionData.totalExercises = exercises.length;
        sessionData.currentExerciseIndex = 0;

        // Mark first exercise as in_progress
        sessionData.exercises[0].status = 'in_progress';
        sessionData.exercises[0].startedAt = new Date();

        const session = new WorkoutSession(sessionData);
        await session.save();

        // Populate exercises for response
        await session.populate('exercises.exercise', 'title slug image gif video difficulty duration description equipment');

        res.status(201).json({
            success: true,
            message: 'Workout session started',
            data: session
        });
    } catch (error) {
        console.error('Start workout session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get current/active workout session
 * @route   GET /api/workout-progress/current
 * @access  Private (User)
 */
router.get('/current', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            user: req.user.id,
            status: { $in: ['in_progress', 'paused'] }
        })
            .populate('exercises.exercise', 'title slug image gif video difficulty duration description equipment')
            .populate('program', 'name slug thumbnail');

        if (!session) {
            return res.status(200).json({
                success: true,
                message: 'No active workout session',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Get current session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get specific workout session
 * @route   GET /api/workout-progress/session/:id
 * @access  Private (User)
 */
router.get('/session/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid session ID' });
        }

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id
        })
            .populate('exercises.exercise', 'title slug image gif video difficulty duration description equipment')
            .populate('program', 'name slug thumbnail');

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.status(200).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// EXERCISE PROGRESS (During Workout)
// ============================================

/**
 * @desc    Get current exercise details
 * @route   GET /api/workout-progress/session/:id/current-exercise
 * @access  Private (User)
 */
router.get('/session/:id/current-exercise', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('exercises.exercise', 'title slug image gif video difficulty duration description equipment');

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (session.status === 'completed') {
            return res.status(200).json({
                success: true,
                message: 'Workout completed',
                data: {
                    isComplete: true,
                    currentExercise: null,
                    nextExercise: null
                }
            });
        }

        const currentIdx = session.currentExerciseIndex;
        const currentExercise = session.exercises[currentIdx];
        const nextExercise = session.exercises[currentIdx + 1] || null;
        const prevExercise = currentIdx > 0 ? session.exercises[currentIdx - 1] : null;

        res.status(200).json({
            success: true,
            data: {
                isComplete: false,
                currentIndex: currentIdx,
                totalExercises: session.exercises.length,
                currentExercise: currentExercise,
                nextExercise: nextExercise,
                prevExercise: prevExercise,
                progress: `${currentIdx + 1}/${session.exercises.length}`
            }
        });
    } catch (error) {
        console.error('Get current exercise error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Complete current exercise and move to next
 * @route   POST /api/workout-progress/session/:id/complete-exercise
 * @access  Private (User)
 * @body    { completedReps?, completedSets?, duration?, restTime? }
 */
router.post('/session/:id/complete-exercise', protect, async (req, res) => {
    try {
        const { completedReps, completedSets, duration, restTime } = req.body || {};

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: { $in: ['in_progress', 'paused'] }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Active session not found' });
        }

        const currentIdx = session.currentExerciseIndex;
        const currentExercise = session.exercises[currentIdx];

        if (!currentExercise) {
            return res.status(400).json({ success: false, message: 'No current exercise' });
        }

        // Update current exercise
        currentExercise.status = 'completed';
        currentExercise.completedAt = new Date();
        currentExercise.completedReps = completedReps ?? currentExercise.targetReps;
        currentExercise.completedSets = completedSets ?? currentExercise.targetSets;
        currentExercise.duration = duration ?? 0;
        currentExercise.restTime = restTime ?? 0;

        // Calculate duration if not provided
        if (!duration && currentExercise.startedAt) {
            const startTime = new Date(currentExercise.startedAt).getTime();
            const endTime = new Date().getTime();
            currentExercise.duration = Math.round((endTime - startTime) / 1000);
        }

        session.completedExercises += 1;
        session.totalDuration += currentExercise.duration;
        session.totalRestTime += currentExercise.restTime;

        // Check if this was the last exercise
        if (currentIdx >= session.exercises.length - 1) {
            // Workout complete!
            session.status = 'completed';
            session.completedAt = new Date();
        } else {
            // Move to next exercise
            session.currentExerciseIndex = currentIdx + 1;
            session.exercises[currentIdx + 1].status = 'in_progress';
            session.exercises[currentIdx + 1].startedAt = new Date();
        }

        session.updatedAt = new Date();
        await session.save();

        await session.populate('exercises.exercise', 'title slug image video difficulty duration description equipment');

        const isComplete = session.status === 'completed';
        const nextExercise = !isComplete ? session.exercises[session.currentExerciseIndex] : null;

        res.status(200).json({
            success: true,
            message: isComplete ? 'Workout completed!' : 'Exercise completed, moving to next',
            data: {
                isWorkoutComplete: isComplete,
                completedExercise: currentExercise,
                nextExercise: nextExercise,
                progress: `${session.completedExercises}/${session.totalExercises}`,
                currentIndex: session.currentExerciseIndex
            }
        });
    } catch (error) {
        console.error('Complete exercise error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Skip current exercise
 * @route   POST /api/workout-progress/session/:id/skip-exercise
 * @access  Private (User)
 */
router.post('/session/:id/skip-exercise', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: { $in: ['in_progress', 'paused'] }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Active session not found' });
        }

        const currentIdx = session.currentExerciseIndex;
        const currentExercise = session.exercises[currentIdx];

        if (!currentExercise) {
            return res.status(400).json({ success: false, message: 'No current exercise' });
        }

        // Mark as skipped
        currentExercise.status = 'skipped';
        currentExercise.completedAt = new Date();
        session.skippedExercises += 1;

        // Check if last exercise
        if (currentIdx >= session.exercises.length - 1) {
            session.status = 'completed';
            session.completedAt = new Date();
        } else {
            session.currentExerciseIndex = currentIdx + 1;
            session.exercises[currentIdx + 1].status = 'in_progress';
            session.exercises[currentIdx + 1].startedAt = new Date();
        }

        session.updatedAt = new Date();
        await session.save();

        await session.populate('exercises.exercise', 'title slug image video difficulty duration description equipment');

        const isComplete = session.status === 'completed';
        const nextExercise = !isComplete ? session.exercises[session.currentExerciseIndex] : null;

        res.status(200).json({
            success: true,
            message: isComplete ? 'Workout completed!' : 'Exercise skipped, moving to next',
            data: {
                isWorkoutComplete: isComplete,
                skippedExercise: currentExercise,
                nextExercise: nextExercise,
                currentIndex: session.currentExerciseIndex
            }
        });
    } catch (error) {
        console.error('Skip exercise error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Update exercise progress (during exercise)
 * @route   PUT /api/workout-progress/session/:id/exercise/:exerciseIndex
 * @access  Private (User)
 * @body    { completedReps?, completedSets?, duration? }
 */
router.put('/session/:id/exercise/:exerciseIndex', protect, async (req, res) => {
    try {
        const exerciseIndex = parseInt(req.params.exerciseIndex, 10);
        const { completedReps, completedSets, duration } = req.body || {};

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (exerciseIndex < 0 || exerciseIndex >= session.exercises.length) {
            return res.status(400).json({ success: false, message: 'Invalid exercise index' });
        }

        const exercise = session.exercises[exerciseIndex];

        if (completedReps !== undefined) exercise.completedReps = completedReps;
        if (completedSets !== undefined) exercise.completedSets = completedSets;
        if (duration !== undefined) exercise.duration = duration;

        session.updatedAt = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Exercise progress updated',
            data: exercise
        });
    } catch (error) {
        console.error('Update exercise error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// SESSION CONTROLS
// ============================================

/**
 * @desc    Pause workout session
 * @route   POST /api/workout-progress/session/:id/pause
 * @access  Private (User)
 */
router.post('/session/:id/pause', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: 'in_progress'
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Active session not found' });
        }

        session.status = 'paused';
        session.pausedAt = new Date();
        session.updatedAt = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Workout paused',
            data: { status: session.status }
        });
    } catch (error) {
        console.error('Pause session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Resume workout session
 * @route   POST /api/workout-progress/session/:id/resume
 * @access  Private (User)
 */
router.post('/session/:id/resume', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: 'paused'
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Paused session not found' });
        }

        // Calculate paused duration
        if (session.pausedAt) {
            const pausedTime = Math.round((new Date().getTime() - session.pausedAt.getTime()) / 1000);
            session.pausedDuration += pausedTime;
        }

        session.status = 'in_progress';
        session.pausedAt = null;
        session.updatedAt = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Workout resumed',
            data: { status: session.status }
        });
    } catch (error) {
        console.error('Resume session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Abandon/cancel workout session
 * @route   POST /api/workout-progress/session/:id/abandon
 * @access  Private (User)
 */
router.post('/session/:id/abandon', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: { $in: ['in_progress', 'paused'] }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Active session not found' });
        }

        session.status = 'abandoned';
        session.completedAt = new Date();
        session.updatedAt = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Workout abandoned',
            data: { status: session.status }
        });
    } catch (error) {
        console.error('Abandon session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Complete workout with notes/rating
 * @route   POST /api/workout-progress/session/:id/finish
 * @access  Private (User)
 * @body    { notes?, rating? }
 */
router.post('/session/:id/finish', protect, async (req, res) => {
    try {
        const { notes, rating } = req.body || {};

        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        if (notes !== undefined) session.notes = notes;
        if (rating !== undefined && rating >= 1 && rating <= 5) session.rating = rating;

        // If still in progress, complete it
        if (session.status !== 'completed') {
            session.status = 'completed';
            session.completedAt = new Date();
        }

        session.updatedAt = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            message: 'Workout finished',
            data: session
        });
    } catch (error) {
        console.error('Finish session error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// HISTORY & CALENDAR
// ============================================

/**
 * @desc    Get workout history for calendar/summary
 * @route   GET /api/workout-progress/history
 * @access  Private (User)
 * @query   { startDate?, endDate?, days?, status? }
 */
router.get('/history', protect, async (req, res) => {
    try {
        const { startDate, endDate, days, status } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = startDate;
            end = endDate;
        } else {
            const numDays = parseInt(days) || 30;
            const endDateObj = new Date();
            const startDateObj = new Date();
            startDateObj.setDate(endDateObj.getDate() - numDays + 1);

            start = startDateObj.toISOString().split('T')[0];
            end = endDateObj.toISOString().split('T')[0];
        }

        const filter = {
            user: req.user.id,
            date: { $gte: start, $lte: end }
        };

        if (status) {
            filter.status = status;
        }

        const sessions = await WorkoutSession.find(filter)
            .select('date title status totalDuration completedExercises totalExercises skippedExercises program programDay rating startedAt completedAt')
            .populate('program', 'name slug thumbnail')
            .sort({ date: -1, startedAt: -1 });

        // Group by date for calendar view
        const byDate = {};
        sessions.forEach(session => {
            if (!byDate[session.date]) {
                byDate[session.date] = [];
            }
            byDate[session.date].push(session);
        });

        // Calculate summary
        const completed = sessions.filter(s => s.status === 'completed');
        const summary = {
            totalSessions: sessions.length,
            completedSessions: completed.length,
            totalDuration: completed.reduce((sum, s) => sum + (s.totalDuration || 0), 0),
            totalExercises: completed.reduce((sum, s) => sum + (s.completedExercises || 0), 0),
            averageRating: completed.length > 0
                ? Math.round((completed.reduce((sum, s) => sum + (s.rating || 0), 0) / completed.filter(s => s.rating).length) * 10) / 10
                : 0
        };

        res.status(200).json({
            success: true,
            data: {
                startDate: start,
                endDate: end,
                sessions: sessions,
                byDate: byDate,
                summary: summary
            }
        });
    } catch (error) {
        console.error('Get workout history error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get today's workout summary
 * @route   GET /api/workout-progress/today
 * @access  Private (User)
 */
router.get('/today', protect, async (req, res) => {
    try {
        const today = getTodayDate();

        const sessions = await WorkoutSession.find({
            user: req.user.id,
            date: today
        })
            .populate('program', 'name slug thumbnail')
            .sort({ startedAt: -1 });

        const completed = sessions.filter(s => s.status === 'completed');
        const active = sessions.find(s => s.status === 'in_progress' || s.status === 'paused');

        res.status(200).json({
            success: true,
            data: {
                date: today,
                hasActiveSession: !!active,
                activeSession: active || null,
                completedToday: completed.length,
                totalDurationToday: completed.reduce((sum, s) => sum + (s.totalDuration || 0), 0),
                totalExercisesToday: completed.reduce((sum, s) => sum + (s.completedExercises || 0), 0),
                sessions: sessions
            }
        });
    } catch (error) {
        console.error('Get today summary error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * @desc    Get program progress (which days completed)
 * @route   GET /api/workout-progress/program/:programId
 * @access  Private (User)
 */
router.get('/program/:programId', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.programId)) {
            return res.status(400).json({ success: false, message: 'Invalid program ID' });
        }

        const program = await ExerciseBundle.findById(req.params.programId)
            .select('name slug totalDays thumbnail difficulty');

        if (!program) {
            return res.status(404).json({ success: false, message: 'Program not found' });
        }

        // Get all sessions for this program
        const sessions = await WorkoutSession.find({
            user: req.user.id,
            program: req.params.programId
        }).select('programDay status completedAt date totalDuration rating');

        // Build day status map
        const dayStatus = {};
        sessions.forEach(session => {
            const day = session.programDay;
            if (!dayStatus[day] || session.status === 'completed') {
                dayStatus[day] = {
                    day: day,
                    status: session.status,
                    completedAt: session.completedAt,
                    totalDuration: session.totalDuration,
                    rating: session.rating
                };
            }
        });

        // Calculate overall progress
        const completedDays = Object.values(dayStatus).filter(d => d.status === 'completed').length;

        res.status(200).json({
            success: true,
            data: {
                program: program,
                totalDays: program.totalDays,
                completedDays: completedDays,
                progressPercentage: Math.round((completedDays / program.totalDays) * 100),
                dayStatus: dayStatus
            }
        });
    } catch (error) {
        console.error('Get program progress error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
