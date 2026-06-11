const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Tables
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      subject_name VARCHAR(255) NOT NULL,
      file_path TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS syllabus (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER,
      topic_name TEXT NOT NULL,
      FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS study_plan (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      date DATE NOT NULL,
      task TEXT NOT NULL,
      status BOOLEAN DEFAULT FALSE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS mock_tests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      subject_name VARCHAR(255) NOT NULL,
      score INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`).catch(err => console.error("Error creating tables", err));

module.exports = {
  query: (text, params) => pool.query(text, params),
};
