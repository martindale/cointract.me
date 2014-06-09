/*
** cointract.me - task model
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;

var TaskSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job' },
  title: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
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

TaskSchema.method.clockIn = function(callback) {

};

TaskSchema.method.clockOut = function(callback) {

};

/*
** Static Methods
*/

TaskSchema.statics.create = function(taskData, callback) {

};

module.exports = mongoose.model('Task', TaskSchema);
