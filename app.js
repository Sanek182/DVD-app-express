require('dotenv').config({ path: '.env' });
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3500;
const secretKey = process.env.COOKIE_KEY;
const sessionKey = process.env.SESSION_KEY

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
};

app.use(logger('dev'));

app.use(cors(corsOptions));

// request parsing block
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// cookies and sessions block
app.use(cookieParser(secretKey));
app.use(session({
    secret: sessionKey,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 1000 * 60 * 60,
    },
}));
const extendSession = (req, res, next) => {
    req.session.cookie.maxAge = 1000 * 60 * 60;
    next();
};
app.use(extendSession);
const authorizeUser = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.id) {
        next();
    } else {
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
};


app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/auth', usersRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
