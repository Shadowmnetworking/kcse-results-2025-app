const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite database');
});

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    index_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    school TEXT NOT NULL,
    mean_grade TEXT NOT NULL,
    grades TEXT NOT NULL
  )
`);

app.use(express.static('public'));
app.use(express.json());

// === FIX: Serve index.html on root URL ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Check results (public)
app.post('/api/results', (req, res) => {
  const { index_number, name } = req.body;

  if (!index_number || !name) {
    return res.status(400).json({ error: 'Missing index or name' });
  }

  db.get(
    'SELECT * FROM students WHERE index_number = ? AND LOWER(name) = LOWER(?)',
    [index_number, name.trim()],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'Candidate not found or name mismatch' });

      res.json({
        index_number: row.index_number,
        name: row.name,
        school: row.school,
        mean_grade: row.mean_grade,
        grades: JSON.parse(row.grades)
      });
    }
  );
});

// =======================
// HIDDEN ADMIN SECTION
// =======================

// Serve hidden admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Get all students (for admin table)
app.get('/api/admin/students', (req, res) => {
  db.all('SELECT id, index_number, name, school, mean_grade FROM students', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single student for editing
app.get('/api/admin/student/:index', (req, res) => {
  db.get('SELECT * FROM students WHERE index_number = ?', [req.params.index], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    row.grades = JSON.parse(row.grades);
    res.json(row);
  });
});

// Save (add or update) student
app.post('/api/admin/student', (req, res) => {
  const { index_number, name, school, mean_grade, grades } = req.body;
  const gradesJson = JSON.stringify(grades);

  db.run(
    `INSERT OR REPLACE INTO students (index_number, name, school, mean_grade, grades)
     VALUES (?, ?, ?, ?, ?)`,
    [index_number, name, school, mean_grade, gradesJson],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Delete student
app.delete('/api/admin/student/:index', (req, res) => {
  db.run('DELETE FROM students WHERE index_number = ?', [req.params.index], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`Hidden Admin Panel: http://localhost:${PORT}/admin`);
});