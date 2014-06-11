/*
** cointract.me - bid schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var hat      = require('hat');
var mailer   = require('../mailer');
var log      = require('../log');
var Job      = require('./job');

var BidSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rate: { type: Number, required: true }, // in satoshis
  pricingType: { type: String, enum: ['fixed','hourly'], default: 'fixed' }
});

/*
** Instance Methods
*/

BidSchema.methods.update = function(user, bidData, calllback) {
  var self = this;
  if (user._id !== self.user) {
    return callback(new Error('Cannot change another user\'s bid'));
  }
  self.rate        = bidDate.rate || self.rate;
  self.pricingType = bidData.pricingType || self.pricingType;
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

/*
** Static Methods
*/

BidSchema.statics.create = function(user, jobId, bidData, callback) {
  var self = this;
  if (!user) return callback(new Error('No user supplied'));
  if (!jobId) return callback(new Error('No job ID supplied'));
  // validate job
  Job.findOne({ _id: job._id }, function(err, job) {
    if (err) return calback(err);
    if (!job) return callback(new Error('Invalid job supplied'));
    var bid = new self({
      user: user._id,
      rate: bidData.jobId,
      pricingType: bidData.pricingType
    });
    bid.save(function(err) {
      if (err) return callback(err);
      callback(null, bid);
    });
  });
};


module.exports = mongoose.model('Bid', BidSchema);
