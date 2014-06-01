/*
** cointract.me - ensure auth middleware
*/

module.exports = function(req, res, next) {
  if (req.user) return next();
  res.format({
    'application/json': function() {
      res.send(401, { error: 'Not authenticated' });
    },
    'text/html': function() {
      res.render('login', {});
    }
  });
};
