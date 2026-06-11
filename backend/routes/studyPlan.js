const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { replanTasks, sendReminderEmail, getTasks, toggleTask, getStats, addCustomTask } = require('../controllers/studyPlanController');

// @route   POST /api/study-plan/replan
// @desc    Auto replan missed tasks to future dates
router.post('/replan', auth, replanTasks);

// @route   POST /api/study-plan/custom
// @desc    Add a manual custom task
router.post('/custom', auth, addCustomTask);

// @route   POST /api/study-plan/remind
// @desc    Send daily reminder email
router.post('/remind', auth, sendReminderEmail);

// @route   GET /api/study-plan
// @desc    Get all study tasks for today and past
router.get('/', auth, getTasks);

// @route   GET /api/study-plan/stats
// @desc    Get study streak and upcoming exam stats
router.get('/stats', auth, getStats);

// @route   PUT /api/study-plan/:id/toggle
// @desc    Toggle task status
router.put('/:id/toggle', auth, toggleTask);

module.exports = router;
