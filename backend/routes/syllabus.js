const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSyllabus, getAllSyllabuses, deleteSyllabus } = require('../controllers/syllabusController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/syllabus/upload
// @desc    Upload PDF syllabus and parse it
router.post('/upload', auth, upload.single('syllabus'), uploadSyllabus);

// @route   GET /api/syllabus
// @desc    Get all subjects and their syllabuses for the user
router.get('/', auth, getAllSyllabuses);

// @route   DELETE /api/syllabus/:id
// @desc    Delete a syllabus
router.delete('/:id', auth, deleteSyllabus);

module.exports = router;
