var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('Rating', function() {

  var Rating = require('../../lib/models/rating');
  var rating = null;

  var critic = { _id: new mongoose.Types.ObjectId() };
  var user   = { _id: new mongoose.Types.ObjectId() };

  describe('#create', function() {

    it('should create a new rating', function(done) {
      Rating.create(critic, {
        user: user._id,
        score: 8
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.score.should.equal(8);
        rating = result;
        done();
      });
    });

  });

  describe('#update', function() {

    it('should update the rating', function(done) {
      rating.update({
        score: 10,
        review: 'Great work!'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.score.should.equal(10);
        result.review.should.equal('Great work!');
        done();
      });
    });

  });

});
