const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateTest, submitTest, getWeaknesses } = require('../controllers/testController');

// @route   POST /api/tests/generate
// @desc    Generate a mock test for a subject
router.post('/generate', auth, generateTest);

// @route   POST /api/tests/submit
// @desc    Submit test score
router.post('/submit', auth, submitTest);

// @route   GET /api/tests/weaknesses
// @desc    Analyze weaknesses based on past scores
router.get('/weaknesses', auth, getWeaknesses);

module.exports = router;
