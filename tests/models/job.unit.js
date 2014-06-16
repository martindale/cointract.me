var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var proxyquire = require('proxyquire');
var sinon      = require('sinon');

mockgoose(mongoose);

describe('Job', function() {

  var Job   = require('../../lib/models/job');
  var user1 = { _id: new mongoose.Types.ObjectId() };
  var job   = null;

  describe('#create', function() {

    it('', function(done) {

    });

  });

});
