var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('Comment', function() {

  var Comment = require('../../lib/models/comment');
  var comment = null;

  var user1 = { _id: new mongoose.Types.ObjectId() };
  var user2 = { _id: new mongoose.Types.ObjectId() };

  describe('#create', function() {

    it('should create a new comment', function(done) {
      Comment.create(user1, {
        content: 'so coin. much tract. wow.'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.dateCreated.should.instanceOf(Date);
        result.content.should.equal('so coin. much tract. wow.');
        comment = result;
        done();
      });
    });

    it('should fail with an nonexistent regarding user', function(done) {
      Comment.create(user1, {
        content: 'how i mine for jobz?',
        regarding: user2._id
      }, function(err, result) {
        should.exist(err);
        done();
      });
    });

  });

  describe('#update', function() {

    it('should update the comment', function(done) {
      comment.update({
        content: 'so tract. much coin. wow.'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.content.should.equal('so tract. much coin. wow.');
        done();
      });
    });

  });

});
