var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');

mockgoose(mongoose);

describe('Task', function() {

  var Task  = require('../../lib/models/task');
  var user1 = { _id: new mongoose.Types.ObjectId() };
  var user2 = { _id: new mongoose.Types.ObjectId() };
  var user3 = { _id: new mongoose.Types.ObjectId() };
  var task  = null;
  var job   = {
    _id: new mongoose.Types.ObjectId(),
    contractor: user1._id,
    owner: user2._id
  };

  describe('#create', function() {

    it('should not create a task for invalid user', function(done) {
      Task.create(user3, job, {
        title: 'Write Tests'
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should let job owner create a task', function(done) {
      Task.create(user2, job, {
        title: 'Write Tests'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.timecard.should.instanceOf(Array);
        done();
      });
    });

    it('should let job contractor create a task', function(done) {
      Task.create(user1, job, {
        title: 'Write Tests'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.timecard.should.instanceOf(Array);
        task = result;
        done();
      });
    });

  });

  describe('#clockIn', function() {

    it('should create a timecard entry', function(done) {
      task.clockIn(function(err, result) {
        should.not.exist(err);
        result.should.have.property('timecard').with.lengthOf(1);
        result.timecard[0].should.have.property('start');
        done();
      });
    });

    it('should fail if not clocked out', function(done) {
      task.clockIn(function(err, result) {
        should.exist(err);
        done();
      });
    });

  });

  describe('#clockOut', function() {

    it('should update the open timecard entry', function(done) {
      task.clockOut('work sucks, let\'s party', function(err, result) {
        should.not.exist(err);
        result.should.have.property('timecard').with.lengthOf(1);
        result.timecard[0].should.have.property('end');
        result.timecard[0].note.should.equal('work sucks, let\'s party');
        done();
      });
    });

    it('should fail if not clocked in', function(done) {
      task.clockOut('work sucks, let\'s party', function(err, result) {
        should.exist(err);
        done();
      });
    });

  });

});
