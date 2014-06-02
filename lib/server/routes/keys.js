/*
** cointract.me - authentication route
*/

var User = require('../../models/user');

module.exports = function(app) {

  app.post('/keys', function(req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    res.format({
      'application/json': function() {
        User.getApiKey(user, pass, function(err, apikey) {
          if (err) return res.send({ error: err.message });
          res.send({ apikey: apikey });
        });
      }
    });
  });

};
