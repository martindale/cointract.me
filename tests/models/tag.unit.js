var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('Tag', function() {

  var Tag = require('../../lib/models/tag');
  var tag = null;

  describe('#create', function() {

    it('should create a new tag', function(done) {
      Tag.create('node.js', function(err, result) {
        should.not.exist(err);
        should.exist(result);
        tag = result;
        done();
      });
    });

  });

  describe('#use', function() {

    it('should increment the popularity of the tag', function(done) {
      tag.use(function(err) {
        should.not.exist(err);
        tag.popularity.should.equal(1);
        done();
      });
    });

  });

});
