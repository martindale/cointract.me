/*
** cointract.me - error handler middleware
*/
var config = require('../../config');
var log    = require('../../log');

module.exports = function(err, req, res, next) {
  log.err(err);
  // prep error message
  var error = { message: err.message };
  // expose stack traces if in debug mode
  if (config.debug) error.stack = err.stack;
  // notify the caller
  res.format({
    'application/json': function() {
      res.send(500, { error: error });
    },
    'text/plain': function() {
      res.send(500, err.stack || err.message);
    },
    'text/html': function() {
      res.render('error', error);
    }
  });
};
