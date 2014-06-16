/*
** cointract.me - task model
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var async    = require('async');
var Job      = require('./job');

var TaskSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  title: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timecard: [{
    start: Date,
    end: Date,
    note: String
  }]
});

TaskSchema.virtual('timecard.total').get(function() {
  var time = 0;
  if (!this.timecard) return time;
  this.timecard.forEach(function(entry) {
    time += (entry.end - entry.start);
  });
  return time;
});

/*
** Instance Methods
*/

TaskSchema.methods.clockIn = function(callback) {
  var self = this;
  // fail if we have a pending timecard
  if (self.timecard.length && !self.timecard[self.timecard.length - 1].end) {
    return callback(new Error('Must clock out before clocking in again'));
  }
  self.timecard.push({ start: Date.now() });
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

TaskSchema.methods.clockOut = function(note, callback) {
  var self = this;
  // fail if we don't have a pending timecard
  if (!self.timecard.length || self.timecard[self.timecard.length - 1].end) {
    return callback(new Error('Must clock in before clocking out again'));
  }
  var lastCard = self.timecard[self.timecard.length - 1];
  // add out time and note
  lastCard.end  = Date.now();
  lastCard.note = note;
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

/*
** Static Methods
*/

TaskSchema.statics.create = function(user, job, taskData, callback) {
  var self = this;
  // validate user and job, then create task
  if (job.contractor !== user._id && job.owner !== user._id) {
    return callback(new Error(
      'Cannot create a task for a job with which you are not involved'
    ));
  }
  var task = new self({
    job: job._id,
    user: user._id,
    title: taskData.title,
    timecard: []
  });
  // save the task
  task.save(function(err) {
    if (err) return callback(err);
    callback(null, task);
  });
};

module.exports = mongoose.model('Task', TaskSchema);
