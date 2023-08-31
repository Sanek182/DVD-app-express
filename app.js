const express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');

const port = process.env.PORT || 3500;

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
