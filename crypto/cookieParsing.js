const cookieParser = require('cookie-parser');
const secretKey = 'cokieKeyForFinalProject2023';

const addCookieParser = (app) => {
    app.use(cookieParser(secretKey));
};
  
module.exports = addCookieParser;