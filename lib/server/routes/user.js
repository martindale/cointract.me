/*
** cointract.me - user operation routes
*/
var auth = require('../middleware/ensure-authenticated');
var User = require('../../models/user');

module.exports = function(app) {

  // get latest user profiles or filter by query
  app.get('/users', function(req, res) {
    var results = 15;
    var page    = req.query.page || 0;
    var skip    = page * results;
    // build search criteria
    var query  = {};
    // only allow these fileds for query
    ['profile', 'username', 'email'].forEach(function(field) {
      if (req.query[field]) query[field] = req.query[field];
    });
    // only show listed
    query['profile.listed'] = true;
    // do lookup
    User.find(query)
      .skip(skip)
      .limit(results)
      .sort({ _id: -1 })
      .exec(function(err, users) {
        var result = err || users;
        if (!err) {
          result = {
            users: users.map(function(user) {
              user = user.toObject();
              delete user.email;
              delete user.verified;
              return User.filter(user);
            })
          };
        }
        else {
          result = { error: result };
        }
        res.format({
          'application/json': function() {
            res.send(err ? 500 : 200, result.users);
          },
          'text/html': function() {
            res.render('users', result);
          }
        });
      });
  });

  // get a single user's public profile
  app.get('/users/:username', function(req, res) {
    User.findOne({
      'username': req.params.username,
      'profile.public': true
    })
    .exec(function(err, user) {
      res.format({
        'application/json': function() {
          res.send(!user ? 404 : 200, { error: 'Not found' } || user.profile);
        },
        'text/html': function() {
          res.render('profile', { profile: user.profile });
        }
      });
    });
  });

  // create a new user account
  app.post('/users', function(req, res) {
    User.create(req.body, function(err, result) {
      res.format({
        'application/json': function() {
          res.send(err ? 400 : 200, err || User.filter(result));
        }
      });
    });
  });

  // update user's account/profile
  app.put('/users/:username', auth, function(req, res) {
    req.user.updateAccount(req.body, function(err, result) {
      if (err) result = { error: err };
      res.format({
        'application/json': function() {
          res.send(err ? 400 : 200, err || result);
        },
        'text/html': function() {
          res.render('profile', result);
        }
      });
    });
  });

};
