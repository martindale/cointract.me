/*
** cointract.me - entry point route
*/

module.exports = function(app) {

  var manifest = require(process.cwd() + '/package');

  app.get('/', function(req, res) {
    res.format({
      'application/json': function() {
        res.send(manifest);
      },
      'text/html': function() {
        var view = req.user ? 'dashboard' : 'landing';
        res.render(view, {
          manifest: manifest,
          user: req.user
        });
      }
    });
  });

  app.get('/login', function(req, res) {
    res.format({
      'text/html': function() {
        res.render('login');
      }
    });
  });

};
