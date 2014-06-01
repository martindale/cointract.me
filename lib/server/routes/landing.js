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
        res.render('landing', {
          manifest: manifest
        });
      }
    });
  });

};
