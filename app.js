'use strict';

// Load config
require('dotenv').config();
const APP_ROOT = process.env.APP_ROOT;
const DEV = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

// Load dependencies
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./app/models/db');
const express = require('express');
const favicon = require('serve-favicon');
const log4js = require('log4js');
const logging = require('./lib/logging');
const nunjucks = require('nunjucks');
const path = require('path');

// Configure logging
const logger = logging.getLogger('app');

// Initialize the database
db.init().then(() => {

  // Configure web server and middleware
  const app = express();
  nunjucks.configure(path.join(APP_ROOT, 'app', 'views'), {
    autoescape: true,
    express: app
  });
  app.use(express.static('public'));
  app.use(favicon(path.join(APP_ROOT, 'public', 'img', 'favicon.ico')));
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(log4js.connectLogger(logging.getLogger('express'), {
    level: 'auto',
    statusRules: [
      { from: 100, to: 199, level: 'debug' },
      { from: 200, to: 299, level: 'debug' },
      { from: 300, to: 399, level: 'debug' },
      { from: 400, to: 499, level: 'debug' },
      { from: 500, to: 599, level: 'error' }
    ]
  }));

  // Require HTTPS in production
  app.use(require('./app/middleware/force-https'));

  // Configure public routes
  app.use('/login', require('./app/controllers/auth/login'));
  app.use('/signup', require('./app/controllers/auth/signup'));

  // Authentication middleware
  app.use(require('./app/middleware/auth'));
  app.use(require('./app/middleware/bind-authed-user-info'));

  // Configure authenticated routes
  app.use('/', require('./app/controllers/index'));
  app.use('/logout', require('./app/controllers/auth/logout'));
  app.use(require('./app/controllers/404'));

  // Start web server
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    logger.info(`Running in ${DEV ? 'development' : 'production'} mode`);
  });

}).catch(error => {
  logger.error(`Error starting up: ${error}`);
});
