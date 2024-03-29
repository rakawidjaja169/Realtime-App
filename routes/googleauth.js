const express = require('express')
const passport = require('passport')
const router = express.Router()


router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));


router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/api/auth/google' }),
  (req, res) => {
    res.redirect('/api/home')
  }
);

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/api/auth/google')
});

module.exports = router
