var express = require('express');
var router = express.Router();
const db = require('../database/connection');
const authenticateToken = require('./cookieValidation')
const { generateToken } = require('./token');

router.post('/reset-password-request', async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM User WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.json({ success: true, message: 'If the email exists in our system, a reset link has been sent.' });
    }

    const user = users[0];
    const token = generateToken();

    const expiresIn = 1 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);

    await db.query('INSERT INTO UserTokens (user_id, token, expires_at, token_type) VALUES (?, ?, ?, "reset")', [user.id, token, expiresAt]);

    // Send email with the reset link containing the token (you'll need to implement this function)
    sendResetEmail(email, token);

    res.json({ success: true, message: 'If the email exists in our system, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM UserTokens WHERE token = ? AND token_type = "reset"', [token]);

    if (rows.length === 0 || new Date(rows[0].expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const userToken = rows[0];

    await db.query('UPDATE User SET password = ? WHERE id = ?', [newPassword, userToken.user_id]);
    await db.query('DELETE FROM PasswordResetTokens WHERE token = ?', [token]);

    res.json({ success: true, message: 'Password has been successfully reset!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


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

    await db.query('INSERT INTO UserTokens (user_id, token, expires_at, token_type) VALUES (?, ?, ?, "auth")', [user.id, token, expiresAt]);

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
