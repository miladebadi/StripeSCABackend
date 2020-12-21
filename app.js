const express = require('express');
const logger = require('morgan');
const paymentRouter = require('./paymentRouter');
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', paymentRouter);

module.exports = app;
