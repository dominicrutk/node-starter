'use strict';

const DEV = process.env.NODE_ENV !== 'production';

const express = require('express');
const logger = require('../../../lib/logging').getLogger('authentication');
const models = require('../../models/db').getModels();

const router = express.Router();

router.post('/', (req, res) => {
  const accessToken = req.cookies.accessToken;
  if (accessToken) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: !DEV
    });
  }

  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: !DEV
    });
  }

  return models.RefreshToken.destroy({
    where: {
      userId: req.authedUser.id,
      token: refreshToken
    }
  }).finally(() => {
    logger.debug(`Signing out user with username '${req.authedUser.username}' and id '${req.authedUser.id}'`);
    return res.sendStatus(200);
  });
});

module.exports = router;
