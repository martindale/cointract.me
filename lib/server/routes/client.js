/*
** cointract.me - entry point route
*/

module.exports = function(app) {

  var manifest   = require(process.cwd() + '/package');
  var categories = Object.keys(require('../../categories'));

  app.get('/', function(req, res) {
    res.format({
      'application/json': function() {
        res.send(manifest);
      },
      'text/html': function() {
        res.render('landing', {
          manifest: manifest,
          user: req.user,
          categories: categories
        });
      }
    });
  });

  app.get('/login', function(req, res) {
    res.format({
      'text/html': function() {
        if (req.user) return res.redirect('/');
        res.render('login', {
          categories: categories
        });
      }
    });
  });

};
