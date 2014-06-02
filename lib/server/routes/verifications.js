/*
** cointract.me - verification routes
*/
var User = require('../../models/user');

module.exports = function(app) {

  // web-based user verification
  app.get('/verifications', function(req, res) {
    // if there isn't a code send to landing page
    if (!req.query.code) return res.redirect('/');
    // lookup the user by their verification code
    User.findOne({ verificationCode: req.query.code }, function(err, user) {
      // if we fail to find the user, back to landing
      if (err || !user) return res.redirect('/');
      // verify the account and redirect to login and populate email
      user.verify(req.query.code, function(err, email) {
        if (err) return res.redirect('/');
        res.redirect('/login');
      });
    });
  });

};
