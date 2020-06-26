'use strict';

const DEV = process.env.NODE_ENV !== 'production';

module.exports = (req, res, next) => {
  if (DEV || req.secure) {
    return next();
  } else {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
};
