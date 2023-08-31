const crypto = require('crypto');
const secretKey = process.env.TOKEN_KEY;

const tokenLifetime = 3600000;

function encode(data) {
    return Buffer.from(data).toString('base64');
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii');
}

function generateToken(userId) {
    const timestamp = Date.now();
    const expiryTime = Date.now() + tokenLifetime;
    const data = `${userId} - ${timestamp} - ${expiryTime}`;
    const encodedData = encode(data);

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(encodedData);
    const hash = hmac.digest('hex');

    const token = `${hash}-${encodedData}`;
    return { token };
}

function decodeUserIdFromToken(token) {
    const [hash, encodedData] = token.split('-');
    const decodedData = decode(encodedData);
    const [userId, timestamp, expiryTime] = decodedData.split('-');
  
    return { userId, timestamp, expiryTime, hash };
}

function validateToken(token, userId) {
    const { userId: decodedUserId, timestamp, expiryTime, hash } = decodeUserIdFromToken(token);
  
    if (userId !== decodedUserId || Date.now() > expiryTime) {
        return false;
    }

    const data = encode(`${userId} - ${timestamp} - ${expiryTime}`);
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(data);
    const expectedHash = hmac.digest('hex');
  
    return expectedHash === hash;
}
  
module.exports = {
    generateToken,
    decodeUserIdFromToken,
    validateToken,
};