'use strict';

const DEV = process.env.NODE_ENV !== 'production';

const jwt = require('jsonwebtoken');
const models = require('../models/db').getModels();

const getAuthorization = (req, res) => {
  if (req.url !== '/') {
    return res.redirect(`/login?dest=${req.url}`);
  }
  return res.redirect('/login');
};

module.exports = (req, res, next) => {
  let accessToken = req.cookies.accessToken || '';
  let refreshToken = req.cookies.refreshToken || '';

  return jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (accessError, accessPayload) => {
    if (!accessError) {
      req.authedUser = {
        id: accessPayload.id
      };
      return next();
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
            return next();
          }).catch(() => {
            return getAuthorization(req, res);
          });
        } else {
          return models.RefreshToken.destroy({
            where: {
              token: refreshToken
            }
          }).finally(() => {
            return getAuthorization(req, res);
          });
        }
      });
    }
  });
};
