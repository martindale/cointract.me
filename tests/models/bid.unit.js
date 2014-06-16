var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var sinon      = require('sinon');

mockgoose(mongoose);

describe('Bid', function() {

  var Bid  = require('../../lib/models/bid');
  var user = { _id: new mongoose.Types.ObjectId() };
  var bid  = null;
  var job  = { _id: new mongoose.Types.ObjectId() };

  describe('#create', function() {

    it('should create a bid for the given job and user', function(done) {
      Bid.create(user, job, {
        rate: 1.5e8,
        pricingType: 'fixed'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.rate.should.equal(1.5e8);
        result.pricingType.should.equal('fixed');
        result.job.should.equal(job._id);
        result.user.should.equal(user._id);
        bid = result;
        done();
      });
    });

    it('should fail without a valid user', function(done) {
      Bid.create(null, job, {
        rate: 1.5e8,
        pricingType: 'fixed'
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should fail without a valid job', function(done) {
      Bid.create(user, null, {
        rate: 1.5e8,
        pricingType: 'fixed'
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

  });

  describe('#update', function() {

    it('should create a bid for the given job and user', function(done) {
      bid.update({
        rate: 1e8,
        pricingType: 'hourly'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.rate.should.equal(1e8);
        result.pricingType.should.equal('hourly');
        done();
      });
    });

  });

  describe('#notify', function() {

    it.skip('should send email notification to job owner', function(done) {
      
    });

  });

});
