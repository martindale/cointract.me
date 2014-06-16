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

    it('should fail with invalid title', function(done) {

    });

    it('should fail with invalid category', function(done) {

    });

    it('should fail with invalid subcategory', function(done) {

    });

    it('should create the job', function(done) {

    });

  });

  describe('#update', function() {

    it('should update the job', function(done) {

    });

  });

  describe('#queueForPublihsing', function() {

    it('should publish the job', function(done) {

    });

  });

  describe('#getPublishURL', function() {

    it('should return a url string for bitpay ipn', function(done) {

    });

  });

  describe('#watch', function() {

    it('should add user to watchlist', function(done) {

    });

  });

  describe('#unwatch', function() {

    it('should remove user from watchlist', function(done) {

    });

  });

  describe('#notifyHired', function() {

    it.skip('should send email notification on accepted bid', function(done) {

    });

  });

  describe('#acceptBid', function() {

    it('should add contractor and set job status to open', function(done) {

    });

  });

});
