var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('User', function () {

  var User = require('../../lib/models/user');

  describe('#create', function() {
    it('should create the user', function(done) {
      done();
      // TODO - write real tests ;)
    });
  });
});
