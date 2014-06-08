/*
** cointract.me - ssl redirect middleware
*/

var config = require('../../config');

module.exports = function(req, res, next) {
  if (!req.secure) {
    var port  = (config.server.port === 443) ? '' : ':' + config.server.port;
    var parts = ['https://', req.host, port, req.url];
    return res.redirect(parts.join(''));
  }
  next();
};
