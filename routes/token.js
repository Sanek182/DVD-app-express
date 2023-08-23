function generateToken() {
    return require('crypto').randomBytes(48).toString('hex');
}
  
module.exports = {
    generateToken,
};