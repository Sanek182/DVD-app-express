var express = require('express');
var router = express.Router();
const db = require('../database/connection');
const authenticateToken = require('./cookieValidation')

function generateToken() {
  return require('crypto').randomBytes(48).toString('hex');
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM User WHERE username = ? AND password = ?', [username, password]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Such user does not exist. Please check your username or password inputs once again."});
    }

    const user = rows[0];
    const token = generateToken(user.id);

    const expiresIn = 1 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);

    await db.query('INSERT INTO UserTokens (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expiresAt]);

    res.cookie('token', token, { httpOnly: true, expires: expiresAt });

    res.json({ success: true, message: 'You have successfully logged in!' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [existingEmails] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existingEmails.length > 0) return res.status(400).json({ success: false, message: 'Email is already taken' });

    await db.query('INSERT INTO User (username, email, password) VALUES (?, ?, ?)', [username, email, password]);

    res.json({ success:true, message: 'Congratulations! Your registration is successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Registration failed.');
  }
});

module.exports = router;
