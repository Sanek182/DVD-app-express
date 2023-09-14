var express = require('express');
var router = express.Router();
const { hashPassword, comparePassword } = require('../../service/passwordEncrypt')
const db = require('../../database/connection');
const { generateToken, decodeUserIdFromToken, validateToken } = require('../../identity-helpers/token');
const { sendPasswordResetEmail } = require('../../service/emailSend');

router.post('/reset-password-request', async (req, res) => {
  const { email } = req.body;
  console.log(req.body);

  try {
    const [users] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    console.log(users);
    if (users.length === 0) {
      return res.json({ success: true, message: 
        'You will receive a reset password link if your address exists in our system.' });
    }

    const user = users[0];
    const { token } = generateToken(user.id);
    const encodedToken = encodeURIComponent(token);

    sendPasswordResetEmail(email, encodedToken);
    res.json({ message: 'Please check your email inbox. Reset password link has been sent to your address.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/reset-password', async (req, res, next) => {
  const { token, newPassword } = req.body;
  console.log('Token:', token);
  console.log('Password:', newPassword);

  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  
  try {
    const { userId } = decodeUserIdFromToken(token);
    if (!validateToken(token, userId)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    req.body.password = newPassword;
    req.userId = userId;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}, hashPassword, async (req, res) => {
  const { hashedPass } = req;

  try {
    await db.query('UPDATE User SET password = ? WHERE id = ?', [hashedPass, req.userId]);
    res.json({ success: true, message: 'Password has been successfully reset!' });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).send('Server error');
  }
});

const setSession = (req, userId, username) => {
  if (!req.session.user) {
    req.session.user = {};
  }
  req.session.user.id = userId;
  req.session.user.username = username;
};

router.post('/login', async (req, res, next) => {
  const { username } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM User WHERE username = ?', [username]);
    console.log("Fetched user data:", rows);
  
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please check your username."
      });
    }

    req.user = rows[0];
    console.log("req.user after assignment:", req.user);
    next();

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}, comparePassword, (req, res) => {
  setSession(req, req.user.id, req.user.username);

  res.json({ success: true, message: 'You have successfully logged in!' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: "Couldn't log you out." });
    }
    return res.status(200).json({ success: true, message: "Logged out" });
  });
});


router.post('/register', hashPassword, async (req, res) => {
  const { username, email } = req.body;
  const { hashedPass } = req;

  try {
    const [existingEmails] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existingEmails.length > 0) return res.status(400).json({ success: false, message: 'Email is already taken' });

    await db.query('INSERT INTO User (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPass]);
    
    res.json({ success:true, message: 'Congratulations! Your registration is successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong. Registration failed.');
  }
});

router.get('/checkAuth', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      isAuthenticated: true,
      username: req.session.user.username,
    });
  } else {
    res.json({
      isAuthenticated: false,
    });
  }
});

function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).send('Authorization required');
}

module.exports = router;
