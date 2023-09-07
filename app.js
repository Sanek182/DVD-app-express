require('dotenv').config({ path: '.env' });

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');

const port = process.env.PORT;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/manipulateUsers/users');

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

app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/auth', usersRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
