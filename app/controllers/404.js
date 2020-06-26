'use strict';

const express = require('express');
const router = express.Router();

router.use((req, res) => {
  return res.format({
    text: () => {
      return res.status(404).send('Error 404: Not found');
    },
    html: () => {
      return res.status(404).render('error.njk', {
        title: 'Not Found',
        navigationId: '404',
        authedUser: req.authedUser,
        message: 'Not Found',
        details: 'Error 404: The requested resource was not found.'
      });
    },
    json: () => {
      return res.status(404).send({
        code: 404,
        error: 'Error 404: Not found'
      });
    },
    default: () => {
      return res.sendStatus(404);
    }
  });
});

module.exports = router;
