const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
  console.log("Connecting to default postgres database to check if target DB exists...");
  const defaultClient = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await defaultClient.connect();
    
    const dbName = process.env.DB_NAME || 'studypilot';
    const res = await defaultClient.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`);
    
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' not found. Creating it...`);
      await defaultClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error("Error connecting to postgres default DB:", err.message);
    console.log("Make sure PostgreSQL is running locally and the default credentials are correct.");
    process.exit(1);
  } finally {
    await defaultClient.end();
  }

  console.log("Connecting to the target database to run schema...");
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'studypilot',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log("Schema applied successfully. All tables created.");
  } catch (err) {
    console.error("Error running schema:", err);
  } finally {
    await pool.end();
  }
}

initDB();
