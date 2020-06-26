'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  return res.status(200).render('home.njk', {
    title: 'Home',
    navigationId: 'home',
    authedUser: req.authedUser
  });
});

router.get('/index', (req, res) => {
  return res.redirect('/');
});

router.get('/home', (req, res) => {
  return res.redirect('/');
});

module.exports = router;
