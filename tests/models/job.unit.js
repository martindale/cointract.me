var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var qs         = require('querystring');
var url        = require('url');

mockgoose(mongoose);

describe('Job', function() {

  var Job   = require('../../lib/models/job');
  var user1 = { _id: new mongoose.Types.ObjectId() };
  var user2 = { _id: new mongoose.Types.ObjectId() };
  var job   = null;

  var bid = {
    _id: new mongoose.Types.ObjectId(),
    rate: 0.25e8,
    pricingType: 'hourly',
    user: user1._id
  };

  var tags = ['bitcoin','javascript','open source'];

  describe('#create', function() {

    it('should fail with invalid title', function(done) {
      Job.create(user2, {
        title: null,
        rate: 1e8,
        pricingType: 'fixed',
        category: 'Programming',
        tags: tags
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should fail with invalid category', function(done) {
      Job.create(user2, {
        title: 'Fix My Crappy Software!',
        rate: 1e8,
        pricingType: 'fixed',
        category: 'Computers',
        tags: tags
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should fail with invalid subcategory', function(done) {
      Job.create(user2, {
        title: 'Fix My Crappy Software!',
        rate: 1e8,
        pricingType: 'fixed',
        category: 'Programming',
        subCategory: 'Internets',
        tags: tags
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should create the job', function(done) {
      Job.create(user2, {
        title: 'Fix My Crappy Software!',
        rate: 1e8,
        pricingType: 'fixed',
        category: 'Programming',
        subCategory: 'Software',
        tags: tags
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.title.should.equal('Fix My Crappy Software!');
        result.rate.should.equal(1e8);
        result.pricingType.should.equal('fixed');
        result.category.should.equal('Programming');
        result.subCategory.should.equal('Software');
        result.tags.should.instanceOf(Array).and.have.lengthOf(3);
        job     = result;
        bid.job = result._id
        done();
      });
    });

  });

  describe('#update', function() {

    it('should update the job', function(done) {
      job.update({
        title: 'PLEASE fix my crappy software!',
        description: 'My nephew built my app, call him for more information',
        subCategory: 'Mobile'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.title.should.equal('PLEASE fix my crappy software!');
        should.exist(result.description);
        result.subCategory.should.equal('Mobile');
        done();
      });
    });

  });

  describe('#queueForPublishing', function() {

    var start = new Date('2022-06-01').toString();
    var end   = new Date('2022-06-08').toString();

    it('should not publish the job with invalid dates', function(done) {
      job.queueForPublishing(end, start, function(err, result) {
        should.exist(err);
        done();
      });
    });

    it('should queue the job for publishing', function(done) {
      job.queueForPublishing(start, end, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.listing.start.toString().should.equal(start);
        result.listing.end.toString().should.equal(end);
        should.exist(result.listing.activationCode);
        result.listing.active.should.equal(false);
        done();
      });
    });

  });

  describe('#publish', function() {

    it('should not publish the job given an invalid status', function(done) {
      job.publish({
        status: 'unpaid'
      }, job.listing.activationCode, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should not publish the job without activation code', function(done) {
      job.publish({
        status: 'paid'
      }, null, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should publish the job given a valid status', function(done) {
      job.publish({
        status: 'paid'
      }, job.listing.activationCode, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.listing.active.should.equal(true);
        done();
      });
    });

  });

  describe('#getPublishURL', function() {

    it('should return a url string for bitpay ipn', function(done) {
      var publishUrl = job.getPublishURL();
      qs.parse(url.parse(publishUrl).query).activationCode.should.equal(
        job.listing.activationCode
      );
      done();
    });

  });

  describe('#watch', function() {

    it('should add user to watchlist', function(done) {
      job.watch(user1, function(err) {
        should.not.exist(err);
        job.watchers.should.instanceOf(Array).and.have.lengthOf(1);
        done();
      });
    });

  });

  describe('#unwatch', function() {

    it('should remove user from watchlist', function(done) {
      job.unwatch(user1, function(err) {
        should.not.exist(err);
        job.watchers.should.instanceOf(Array).and.have.lengthOf(0);
        done();
      });
    });

  });

  describe('#notifyHired', function() {

    it.skip('should send email notification on accepted bid', function(done) {

    });

  });

  describe('#acceptBid', function() {

    it('should add contractor and set job status to open', function(done) {
      job.acceptBid(bid, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.rate.should.equal(bid.rate);
        result.pricingType.should.equal(bid.pricingType);
        result.contractor.should.equal(bid.user);
        done();
      });
    });

  });

});
