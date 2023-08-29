const crypto = require('crypto');
const secretKey = process.env.TOKEN_KEY;

function encode(data) {
    return Buffer.from(data).toString('base64');
}

function decode(data) {
    return Buffer.from(data, 'base64').toString('ascii');
}

function generateToken(userId) {
    const timestamp = Date.now();
    const data = `${userId}-${timestamp}`;
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
    const [userId, timestamp] = decodedData.split('-');
  
    return { userId, timestamp, hash };
}

function validateToken(token, userId) {
    const { userId: decodedUserId, timestamp, hash } = decodeUserIdFromToken(token);
  
    if (userId !== decodedUserId) {
        return false;
    }

    const data = encode(`${userId}-${timestamp}`);
    const hmac = crypto.createHmac('sha256', 'YourSecureSecretKey');
    hmac.update(data);
    const expectedHash = hmac.digest('hex');
  
    return expectedHash === hash;
}
  
module.exports = {
    generateToken,
    decodeUserIdFromToken,
    validateToken,
};