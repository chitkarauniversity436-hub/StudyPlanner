-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL
);

-- Create Syllabus Table
CREATE TABLE IF NOT EXISTS syllabus (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL
);

-- Create Study Plans Table
CREATE TABLE IF NOT EXISTS study_plan (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task TEXT NOT NULL,
    status BOOLEAN DEFAULT FALSE
);

-- Create Mock Tests Table
CREATE TABLE IF NOT EXISTS mock_tests (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    score INT NOT NULL
);
