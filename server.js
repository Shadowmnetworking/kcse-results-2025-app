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
const CALLBACK_URL = `https://kcse-results-2025-app.onrender.com/api/mpesa/callback`; // Your Render URL

// Database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite database');
});

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public: Check if student exists (requires payment)
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
        message: 'Payment required to view results',
        amount: 50
      });
    }
  );
});

// Initiate STK Push
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phone, amount = 50, index_number } = req.body;

  if (!phone || phone.length !== 12 || !phone.startsWith('254')) {
    return res.status(400).json({ error: 'Invalid phone number. Use format 2547xxxxxxxx' });
  }

  try {
    // Get OAuth token
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const { data } = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });

    const token = data.access_token;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: index_number || "KCSE",
      TransactionDesc: "KCSE Results Access"
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (error) {
    console.error('M-Pesa error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// M-Pesa Callback
app.post('/api/mpesa/callback', (req, res) => {
  console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
  // In real app: mark payment as successful for the AccountReference (index_number)
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Admin routes (keep your existing ones)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ... (keep all your admin GET/POST/DELETE routes here)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Portal: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});
