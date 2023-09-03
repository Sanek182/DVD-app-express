require('dotenv').config({ path: '.env' });

const cookieParser = require('cookie-parser');
const session = require('express-session');
const secretKey = process.env.COOKIE_KEY;
const sessionKey = process.env.SESSION_KEY

module.exports = (app) => {
    app.use(cookieParser(secretKey));
    app.use(session({
        secret: sessionKey,
        resave: false,
        saveUninitialized: true,
        rolling: true,
        cookie: { 
            secure: false,
            maxAge: 1000 * 60 * 60,
        },
    }));

};
