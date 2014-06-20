/*
** cointract.me - authentication route
*/

var config     = require('../../config');
var User       = require('../../models/user');
var categories = Object.keys(require('../../categories'));

module.exports = function(app) {

  app.post('/keys', function(req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    // get apikey
    User.getApiKey(user, pass, function(err, apikey) {
      res.format({
        'application/json': function() {
          if (err) return res.send({ error: err.message });
          res.send({ apikey: apikey });
        },
        'text/html': function() {
          if (err) {
            res.statusCode = 401;
            return res.render('login', {
              error: err.message,
              categories: categories
            });
          }
          res.cookie('apikey', apikey, {
            expires: new Date(Date.now() + 900000),
            httpOnly: true,
            secure: config.server.ssl.enabled
          });
          res.redirect('/');
        }
      });
    });
  });

};
