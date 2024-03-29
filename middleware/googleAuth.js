module.exports = {
    ensureAuth: function (req, res, next) {
        if (req.isAuthenticated()) {
        return next()
        } else {
        res.redirect('/api/auth/google')
        }
    },
    ensureGuest: function (req, res, next) {
        if (!req.isAuthenticated()) {
        return next();
        } else {
        res.redirect('/api/home');
        }
    },
};
  