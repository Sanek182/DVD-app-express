var express = require('express');
var router = express.Router();
const db = require('../database/connection');

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM User WHERE username = ? AND password = ?', [username, password]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'No user found or invalid password' });
    }

    res.json({ success: true, message: 'Login successful!' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/auth/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

  try {
    const [existingEmails] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existingEmails.length > 0) return res.status(400).json({ message: 'Email is already taken' });

    await db.query('INSERT INTO User (username, email, password) VALUES (?, ?, ?)', [username, email, password]);

    res.json({ message: 'Congratulations! Your registration is successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Registration failed.');
  }
});

module.exports = router;
