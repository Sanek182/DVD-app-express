require('dotenv').config({ path: '.env' });
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const port = process.env.PORT || 3500;
const cors = require('cors');
const secretKey = process.env.COOKIE_KEY;
const bodyParser = require('body-parser');
const sessionKey = process.env.SESSION_KEY

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

const corsWay = {
    origin: 'http://localhost:3000',
    credentials: true
};

app.use(logger('dev'));
app.use(cors(corsWay));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(secretKey));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: sessionKey,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5 * 60 * 1000 }
}));

app.use(bodyParser.json());

app.use('/', indexRouter);
app.use('/auth', usersRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
