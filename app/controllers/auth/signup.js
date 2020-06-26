'use strict';

const DEV = process.env.NODE_ENV !== 'production';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 12;

const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const logger = require('../../../lib/logging').getLogger('authentication');
const models = require('../../models/db').getModels();

const router = express.Router();

router.post('/', (req, res) => {
  if (req.body) {
    const { username, password } = req.body;

    let accessToken;
    let refreshToken;
    models.User.findOne({
      where: {
        username
      }
    }).then(user => {
      if (user) {
        return Promise.reject({
          reason: 'exists'
        });
      }
      return bcrypt.hash(password, SALT_ROUNDS);
    }).then(hash => {
      return models.User.create({
        username,
        password: hash,
        role: 'member'
      });
    }).then(user => {
      accessToken = jwt.sign({
        id: user.id
      }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '1h'
      });
      refreshToken = jwt.sign({
        id: user.id
      }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '14d'
      });
      return models.RefreshToken.create({
        userId: user.id,
        token: refreshToken
      });
    }).then(() => {
      logger.debug(`Login attempt succeeded for username '${username}'`);
      res.cookie('accessToken', accessToken, {
        expires: new Date(new Date().getTime() + 60 * 60 * 1000),
        httpOnly: true,
        secure: !DEV
      });
      res.cookie('refreshToken', refreshToken, {
        expires: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: !DEV
      });
      return res.sendStatus(200);
    }).catch(error => {
      switch (error.reason) {
        case 'exists':
          logger.debug(`Login attempt failed: username '${username}' already exists`);
          return res.status(401).json({
            error: 'An account already exists with that username'
          });
          break;
        default:
          logger.debug(`Login attempt failed because of an internal server error: ${error}`);
          return res.status(500).json({
            error: 'Internal server error'
          });
      }
    });
  }
});

module.exports = router;
