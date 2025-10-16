const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 8080;

// Parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL pool
const pool = new Pool({
  user: process.env.PGUSER || 'myuser',
  host: process.env.PGHOST || 'db',
  database: process.env.PGDATABASE || 'mydatabase',
  password: process.env.PGPASSWORD || 'mypassword',
  port: process.env.PGPORT || 5432,
});

// Create users table
pool.query(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`).catch(err => console.error('Error creating table:', err));

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Missing fields');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    res.send('User registered successfully. <a href="/">Go to login</a>');
  } catch (err) {
    console.error(err);
    res.send('Database error or username already exists');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (result.rows.length === 0) return res.send('User not found');

    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return res.send('Invalid password');

    res.send('Login successful!');
  } catch (err) {
    console.error(err);
    res.send('Database error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

