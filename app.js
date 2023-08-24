var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const port = process.env.PORT || 3500;
const cors = require('cors');
const addCookieParser = require('./crypto/cookieParsing')
const bodyParser = require('body-parser');

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
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());

app.use('/', indexRouter);
app.use('/auth', usersRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

addCookieParser(app);

module.exports = app;
