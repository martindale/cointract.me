var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('User', function() {

  var util = require('../../lib/util');
  var User = require('../../lib/models/user');
  var user = null;

  describe('#create', function() {

    it('should create the user', function(done) {
      User.create({
        email: 'valid@email.com',
        password: 'password',
        username: 'testuser'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        user = result;
        done();
      });
    });

    it('should fail with existing email', function(done) {
      User.create({
        email: 'valid@email.com',
        password: 'password',
        username: 'testuser2'
      }, function(err) {
        should.exist(err);
        done();
      });
    });

    it('should fail with duplicate username', function(done) {
      User.create({
        email: 'another@email.com',
        password: 'password',
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

  describe('#createApiKey', function() {

    it('should generate a new api key', function(done) {
      user.createApiKey();
      should.exist(user.apiKey);
      done();
    });

  });

  describe('#verify', function() {

    it('should fail witout a valid verification code', function(done) {
      user.verify('', function(err) {
        should.exist(err);
        done();
      })
    });

    it('should verify the user', function(done) {
      user.verify(user.verificationCode, function(err) {
        should.not.exist(err);
        done();
      })
    });

  });

  describe('#changePassword', function() {

    it('should fail with incorrect password', function(done) {
      user.changePassword('wrong', 'newpassword', function(err) {
        should.exist(err);
        done();
      });
    });

    it('should succeed with correct password', function(done) {
      user.changePassword('password', 'newpassword', function(err) {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('#updateAccount', function() {

    it('should update the account profile and password', function(done) {
      user.updateAccount({
        password: { current: 'newpassword', new: 'password' },
        profile: {
          firstName: 'Testy',
          lastName: 'McTesterson',
          listed: true,
          public: true
        }
      }, function(err, result) {
        result.profile.firstName.should.equal('Testy');
        result.profile.lastName.should.equal('McTesterson');
        result.profile.listed.should.equal(true);
        result.profile.public.should.equal(true);
        user.password.should.equal(util.hashPassword('password'));
        done();
      });
    });

  });

  describe('#getApiKey', function() {

    it('should not find an api key for wrong credentials', function(done) {
      User.getApiKey('testuser', 'wrongpass', function(err) {
        should.exist(err);
        done();
      });
    });

    it('should find an api key for the user', function(done) {
      User.getApiKey('testuser', 'password', function(err, key) {
        should.not.exist(err);
        key.should.equal(user.apiKey);
        done();
      });
    });

  });

});
