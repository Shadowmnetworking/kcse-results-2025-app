const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// === MPESA SANDBOX CONFIG ===
const CONSUMER_KEY = 'XP0P7pPMh2CGBKf5mYqegWr6fos5CpDG';
const CONSUMER_SECRET = 'FvaVinVabUtaV49aGAD8CnUkXwVXVTgjEXM6VHboUbp9fGsK64lc6cD53uydbX';
const SHORTCODE = '174379';
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const CALLBACK_URL = 'https://kcse-results-2025-app.onrender.com/api/mpesa/callback'; // Your live Render URL

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

// Serve main page on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public: Check student (requires payment)
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
      if (!row) return res.status(404).json({ error: 'Candidate not found' });

      res.json({
        requires_payment: true,
        message: 'Payment of KSh 50 required to view results',
        amount: 50
      });
    }
  );
});

// Initiate STK Push Payment
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount = 50, index_number } = req.body;

  // Validate Kenyan phone format (2547...)
  if (!phone || !/^254[0-9]{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone. Use format: 254797413800' });
  }

  try {
    // Get OAuth token
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const token = tokenResponse.data.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    // STK Push payload
    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: index_number || 'KCSE2025',
      TransactionDesc: 'Payment for KCSE Results Access'
    };

    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(stkResponse.data);
  } catch (error) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initiate payment. Try again.' });
  }
});

// M-Pesa Callback (when payment is made)
app.post('/api/mpesa/callback', (req, res) => {
  console.log('=== M-PESA CALLBACK RECEIVED ===');
  console.log(JSON.stringify(req.body, null, 2));

  // In future: save successful payment to database using req.body.Body.stkCallback.ResultCode === 0
  // For now, just accept
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Hidden Admin Panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Keep your admin CRUD routes here (from previous code)
// ... (GET /api/admin/students, POST /api/admin/student, etc.)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Portal: https://kcse-results-2025-app.onrender.com`);
  console.log(`Admin: https://kcse-results-2025-app.onrender.com/admin`);
});
