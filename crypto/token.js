function generateToken(type, expiresInHours = 1) {
    const token = require('crypto').randomBytes(48).toString('hex');
    const expiresIn = expiresInHours * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);

    return { token, expiresAt, tokenType: type };
}
  
module.exports = {
    generateToken,
};