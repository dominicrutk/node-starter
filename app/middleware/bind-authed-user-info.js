'use strict';

const logger = require('../../lib/logging').getLogger('authentication');
const models = require('../models/db').getModels();

// This middleware makes sure that the user role (and other info) is checked on every request instead
// of keeping the role (and other info) stored in the access token. Otherwise, a rogue user could be
// demoted but would not lose their privileges until they let their tokens expire (after 14 days).
module.exports = (req, res, next) => {
  const id = req.authedUser.id;
  if (!id) {
    return res.redirect('/login');
  }
  return models.User.findOne({
    where: {
      id
    }
  }).then(user => {
    if (user.role === 'deactivated') {
      return res.sendStatus(403);
    }
    req.authedUser.username = user.username;
    req.authedUser.role = user.role;
    return next();
  }).catch(error => {
    logger.error(`Could not bind role to user with id '${id}': ${error}`);
    return res.sendStatus(500);
  });
};
