const pdfParse = require('pdf-parse');
const db = require('../config/db');
const { OpenAI } = require('openai');
const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadSyllabus = async (req, res) => {
  try {
    const { subject_name } = req.body;
    
    if (!req.file || !subject_name) {
      return res.status(400).json({ error: 'Please provide a file and a subject name' });
    }

    const user_id = req.user.id;

    // 1. Insert Subject
    let subjectResult = await db.query('SELECT id FROM subjects WHERE subject_name = $1 AND user_id = $2', [subject_name, user_id]);
    let subjectId;

    if (subjectResult.rows.length === 0) {
      const newSubject = await db.query(
        'INSERT INTO subjects (user_id, subject_name) VALUES ($1, $2) RETURNING id',
        [user_id, subject_name]
      );
      subjectId = newSubject.rows[0].id;
    } else {
      subjectId = subjectResult.rows[0].id;
    }

    // 2. Parse PDF from memory buffer directly (no downloading needed!)
    const dataBuffer = req.file.buffer;
    const data = await pdfParse(dataBuffer);
    const extractedText = data.text;

    // 3. Upload to Cloudinary via stream
    const fileUrl = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'studypilot_syllabuses', resource_type: 'raw', format: 'pdf' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    // Save file path to subject
    await db.query('UPDATE subjects SET file_path = $1 WHERE id = $2', [fileUrl, subjectId]);

    // 3. Save syllabus text
    await db.query(
      'INSERT INTO syllabus (subject_id, topic_name) VALUES ($1, $2)',
      [subjectId, extractedText.substring(0, 1000)]
    );

    // 4. Generate Study Plan via OpenAI
    let generatedPlan = [];
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
      const prompt = `You are a study planner.
Subject: ${subject_name}
Syllabus Extract:
${extractedText.substring(0, 2000)}

Create a day-by-day study schedule for 7 days. Return the response as a simple JSON array of strings, where each string is a daily task. E.g. ["Day 1: Intro", "Day 2: Arrays", ...]`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // Fallback to parsing if needed
      });

      try {
        // Extract array from response assuming the model returns {"plan": ["...", "..."]}
        const responseJson = JSON.parse(aiResponse.choices[0].message.content);
        if (responseJson.plan && Array.isArray(responseJson.plan)) {
          generatedPlan = responseJson.plan;
        } else if (Array.isArray(responseJson)) {
          generatedPlan = responseJson;
        }
      } catch (e) {
        console.error("Failed to parse OpenAI JSON", e);
      }
    }

    // Fallback if OpenAI fails or key is missing
    if (generatedPlan.length === 0) {
      generatedPlan = [
        `Study Day 1: Introduction to ${subject_name}`,
        `Study Day 2: Core Concepts of ${subject_name}`,
        `Study Day 3: Advanced Topics of ${subject_name}`,
        `Study Day 4: Revision of ${subject_name}`
      ];
    }

    // 5. Insert into Study Plan Table
    let currentDate = new Date();
    for (let task of generatedPlan) {
      await db.query(
        'INSERT INTO study_plan (user_id, date, task) VALUES ($1, $2, $3)',
        [user_id, currentDate.toISOString().split('T')[0], task]
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({ message: 'Syllabus parsed and study plan generated successfully!', plan: generatedPlan });
  } catch (error) {
    console.error('Error in uploadSyllabus:', error);
    res.status(500).json({ error: 'Failed to process syllabus PDF' });
  }
};

const getAllSyllabuses = async (req, res) => {
  try {
    const user_id = req.user.id;
    const result = await db.query(
      'SELECT s.id, s.subject_name, s.file_path, syl.topic_name as syllabus_text FROM subjects s LEFT JOIN syllabus syl ON s.id = syl.subject_id WHERE s.user_id = $1 ORDER BY s.id DESC',
      [user_id]
    );
    res.status(200).json({ syllabuses: result.rows });
  } catch (error) {
    console.error('Error fetching syllabuses:', error);
    res.status(500).json({ error: 'Failed to fetch syllabuses' });
  }
};

const deleteSyllabus = async (req, res) => {
  try {
    const user_id = req.user.id;
    const subject_id = req.params.id;

    // Fetch the subject to get the file path
    const subjectResult = await db.query('SELECT file_path FROM subjects WHERE id = $1 AND user_id = $2', [subject_id, user_id]);
    
    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const filePath = subjectResult.rows[0].file_path;

    // Delete from database
    await db.query('DELETE FROM syllabus WHERE subject_id = $1', [subject_id]);
    await db.query('DELETE FROM subjects WHERE id = $1 AND user_id = $2', [subject_id, user_id]);

    // Delete from Cloudinary
    if (filePath && filePath.includes('cloudinary.com')) {
      const urlParts = filePath.split('/');
      const folderIndex = urlParts.indexOf('studypilot_syllabuses');
      if (folderIndex !== -1) {
        // public_id for raw files includes the extension
        const publicId = urlParts.slice(folderIndex).join('/');
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          console.log(`Deleted Cloudinary asset: ${publicId}`);
        } catch (err) {
          console.error(`Failed to delete Cloudinary asset: ${publicId}`, err);
        }
      }
    }

    res.status(200).json({ message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    res.status(500).json({ error: 'Failed to delete syllabus' });
  }
};

module.exports = {
  uploadSyllabus,
  getAllSyllabuses,
  deleteSyllabus
};
