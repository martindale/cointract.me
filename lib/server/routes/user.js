/*
** cointract.me - user operation routes
*/
var auth = require('../middleware/ensure-authenticated');
var User = require('../../models/user');

module.exports = function(app) {

  // get latest user profiles or filter by query
  app.get('/users', function(req, res) {

  });

  // get a single user's public profile
  app.get('/users/:username', function(req, res) {

  });

  // create a new user account
  app.post('/users', function(req, res) {
    User.create(req.body, function(err, result) {
      res.format({
        'application/json': function() {
          res.send(err ? 400 : 200, err || result);
        }
      });
    });
  });

  // update user's account/profile
  app.put('/users/:username', auth, function(req, res) {
    
  });

};
