require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/syllabus', require('./routes/syllabus'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/study-plan', require('./routes/studyPlan'));

app.get('/', (req, res) => {
  res.send('StudyPilot API is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
