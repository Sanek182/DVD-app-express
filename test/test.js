const crypto = require('crypto');
const TOKEN_KEY = "tokenKeyForFinalProjectAug2023";

function generateToken(userId) {
    const timestamp = Date.now();
    const expiryTime = timestamp + 1000 * 60 * 60;  // 1 hour

    const data = `${userId} - ${timestamp} - ${expiryTime}`;
    const hash = crypto.createHmac('sha256', TOKEN_KEY).update(data).digest('hex');

    const encodedData = Buffer.from(data).toString('base64');
    return `${hash}-${encodedData}`;
}

function validateToken(token, userId) {
    const [hash, encodedData] = token.split('-');
    const data = Buffer.from(encodedData, 'base64').toString('utf-8');

    const expectedHash = crypto.createHmac('sha256', TOKEN_KEY).update(data).digest('hex');

    console.log(`Token Hash: ${hash}`);
    console.log(`Computed Hash: ${expectedHash}`);

    return hash === expectedHash;
}

// Testing
const sampleUserId = 123;
const token = generateToken(sampleUserId);

console.log(`Generated Token: ${token}`);

const isValid = validateToken(token, sampleUserId);
console.log(`Token is valid: ${isValid}`);