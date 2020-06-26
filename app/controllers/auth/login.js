'use strict';

const DEV = process.env.NODE_ENV !== 'production';

const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const logger = require('../../../lib/logging').getLogger('authentication');
const models = require('../../models/db').getModels();

const router = express.Router();

const loadLogin = (req, res) => {
  return res.status(200).render('login.njk', {
    title: 'Login',
    navigationId: 'hidden'
  });
};

const redirect = (req, res) => {
  if (req.query.dest) {
    return res.redirect(req.query.dest);
  }
  return res.redirect('/');
};

router.get('/', (req, res) => {
  let accessToken = req.cookies.accessToken || '';
  let refreshToken = req.cookies.refreshToken || '';

  return jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (accessError, accessPayload) => {
    if (!accessError) {
      req.authedUser = {
        id: accessPayload.id
      };
      return redirect(req, res);
    } else {
      return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (refreshError, refreshPayload) => {
        if (!refreshError) {
          return models.RefreshToken.destroy({
            where: {
              userId: refreshPayload.id,
              token: refreshToken
            }
          }).then(tokensDestroyed => {
            if (tokensDestroyed !== 1) {
              return Promise.reject();
            }
            accessToken = jwt.sign({
              id: refreshPayload.id
            }, process.env.JWT_ACCESS_SECRET, {
              expiresIn: '1h'
            });
            refreshToken = jwt.sign({
              id: refreshPayload.id
            }, process.env.JWT_REFRESH_SECRET, {
              expiresIn: '14d'
            });
            return models.RefreshToken.create({
              userId: refreshPayload.id,
              token: refreshToken
            });
          }).then(() => {
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
            req.authedUser = {
              id: refreshPayload.id
            };
            return redirect(req, res);
          }).catch(() => {
            return loadLogin(req, res);
          });
        } else {
          return models.RefreshToken.destroy({
            where: {
              token: refreshToken
            }
          }).finally(() => {
            return loadLogin(req, res);
          });
        }
      });
    }
  });
});

router.post('/', (req, res) => {
  if (req.body) {
    const { username, password } = req.body;

    let userId;
    let userRole;
    let accessToken;
    let refreshToken;
    models.User.findOne({
      where: {
        username
      }
    }).then(user => {
      if (!user) {
        return Promise.reject({
          reason: 'username'
        });
      }
      userId = user.id;
      userRole = user.role;
      return bcrypt.compare(password, user.password);
    }).then(correctPassword => {
      if (!correctPassword) {
        return Promise.reject({
          reason: 'password'
        });
      }
      if (userRole === 'deactivated') {
        return Promise.reject({
          reason: 'deactivated'
        });
      }
      accessToken = jwt.sign({
        id: userId
      }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '1h'
      });
      refreshToken = jwt.sign({
        id: userId
      }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '14d'
      });
      return models.RefreshToken.create({
        userId,
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
        case 'username':
          logger.debug(`Login attempt failed: username '${username}' not found`);
          return res.status(401).json({
            error: 'Username or password is incorrect'
          });
          break;
        case 'password':
          logger.debug(`Login attempt failed: incorrect password for username '${username}'`);
          return res.status(401).json({
            error: 'Username or password is incorrect'
          });
          break;
        case 'deactivated':
          logger.debug(`Login attempt failed: user with username '${username}' tried to log in to a deactivated account`);
          return res.status(401).json({
            error: 'Account deactivated'
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
