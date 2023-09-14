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
    console.log('The data when generating is:' + data);
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
    const [userId, timestamp, expiryTimeStr] = decodedData.split('-').map(s => s.trim());
    const expiryTime = Number(expiryTimeStr);
  
    return { userId, timestamp, expiryTime, hash };
}

function validateToken(token, userId) {
    const { userId: decodedUserId, timestamp, expiryTime, hash } = decodeUserIdFromToken(token);
  
    if (String(userId) !== String(decodedUserId)) {
        console.log('Token userId mismatch:', userId, decodedUserId);
        return false;
    }

    if (Date.now() > expiryTime) {
        console.log('Token has expired');
        return false;
    }

    const data = encode(`${userId} - ${timestamp} - ${expiryTime}`);
    console.log('The data when validating is:' + data);
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(data);
    const expectedHash = hmac.digest('hex');

    if (expectedHash !== hash) {
        console.log('Hash mismatch:', expectedHash, hash);
    }
  
    return expectedHash === hash;
}
  
module.exports = {
    generateToken,
    decodeUserIdFromToken,
    validateToken,
};