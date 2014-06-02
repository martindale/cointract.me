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
    ['profile', 'email'].forEach(function(field) {
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
          }
        });
      });
  });

  // get a single user's public profile
  app.get('/users/:username', function(req, res) {
    var query = {
      'profile.username': req.params.username
    };
    if (!req.user || req.user.profile.username !== query.username) {
      query['profile.public'] = true;
    }
    User.findOne(query).exec(function(err, user) {
      var result = !user ? { error: 'Not found' } : { profile: user.profile };
      res.format({
        'application/json': function() {
          res.send(!user ? 404 : 200, result);
        },
        'text/html': function() {
          res.render('profile', result);
        }
      });
    });
  });

  // create a new user account
  app.post('/users', function(req, res) {
    User.create(req.body, function(err, result) {
      var result = err ? { error: err.message } : User.filter(result);
      res.format({
        'application/json': function() {
          res.send(err ? 400 : 200, result);
        }
      });
    });
  });

  // update user's account/profile
  app.put('/users/me', auth, function(req, res) {
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

  // web-based user verification
  app.get('/users/me/verifications', function(req, res) {
    // if there isn't a code send to landing page
    if (!req.query.code) return res.redirect('/');
    // lookup the user by their verification code
    User.findOne({ verificationCode: req.query.code }, function(err, user) {
      // if we fail to find the user, back to landing
      if (err || !user) return res.redirect('/');
      // verify the account and redirect to login and populate email
      user.verify(req.query.code, function(err, email) {
        if (err) return res.redirect('/');
        res.redirect('/login');
      });
    });
  });

};
