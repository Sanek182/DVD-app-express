const db = require('../database/connection');

async function authenticateToken(req, res, next) {
   const token = req.cookies.token;
  
  if (!token) return res.status(401).send('Access Denied');
  
  try {
    const [rows] = await db.query('SELECT * FROM UserTokens WHERE token = ?', [token]);
  
    if (rows.length === 0) {
      return res.status(401).send('Invalid Token');
    }

    const userToken = rows[0];
    if (new Date(userToken.expires_at) < new Date()) {
      return res.status(401).send('Token Expired');
    }
  
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred');
  }
}

module.exports = { authenticateToken };