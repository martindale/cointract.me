/*
** cointract.me - auth middleware
*/

var User = require('../../models/user');

module.exports = function(req, res, next) {
  var apiKey = req.header('apikey') || req.cookies.apikey;
  if (!apiKey) {
    req.user = null;
    return next();
  }
  User.findOne({ apiKey: apiKey }, function(err, user) {
    if (err) return next(err);
    if (!user) return next();
    req.user = user;
    next();
  });
};
