require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  try {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;`);
    
    // Also create flashcards table for Phase 2 while we're at it
    await db.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        last_reviewed DATE,
        confidence_score INT DEFAULT 0
      );
    `);

    console.log("Migration successful!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
