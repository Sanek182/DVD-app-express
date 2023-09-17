const secretKey = process.env.TOKEN_KEY;
const jwt = require('jsonwebtoken');

function generateToken(userId) {
    const payload = {
      userId,
      iat: Date.now(),
      exp: Date.now() + 3600000
    };
  
    const token = jwt.sign(payload, secretKey);
    return { token };
}

function decodeUserIdFromToken(token) {
    try {
      const decoded = jwt.verify(token, secretKey);
      return { userId: decoded.userId, exp: decoded.exp };
    } catch (err) {
      return null;
    }
}

function validateToken(token, userId) {
    const decoded = decodeUserIdFromToken(token);
    if (!decoded) {
      return false;
    }
    
    if (decoded.userId !== userId || decoded.exp <= Date.now()) {
      return false;
    }
    
    return true;
}
  
module.exports = {
    generateToken,
    decodeUserIdFromToken,
    validateToken,
};