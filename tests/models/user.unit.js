var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('User', function () {

  var User   = require('../../lib/models/user');
  var crypto = require('crypto');

  describe('#create', function() {

    it('should create the user', function(done) {
      User.create({
        email: 'valid@email.com',
        password: crypto.createHash('sha1').update('password').digest('hex'),
        username: 'testuser'
      }, done);
    });

    it('should fail with existing email', function(done) {
      User.create({
        email: 'valid@email.com',
        password: crypto.createHash('sha1').update('password').digest('hex'),
        username: 'testuser2'
      }, function(err) {
        should.exist(err);
        done();
      });
    });

    it('should fail with duplicate username', function(done) {
      User.create({
        email: 'another@email.com',
        password: crypto.createHash('sha1').update('password').digest('hex'),
        username: 'testuser'
      }, function(err, user) {
        should.exist(err);
        done();
      });
    });

    it('should fail with no password', function(done) {
      User.create({
        email: 'another@email.com',
        username: 'testuser2'
      }, function(err) {
        should.exist(err);
        done();
      });
    });

  });

});
