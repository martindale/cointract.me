/*
** cointract.me - bid schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var hat      = require('hat');
var mailer   = require('../mailer');
var log      = require('../log');

var BidSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rate: { type: Number, required: true }, // in satoshis
  pricingType: { type: String, enum: ['fixed','hourly'], default: 'fixed' }
});

/*
** Instance Methods
*/

BidSchema.methods.update = function(bidData, callback) {
  var self = this;
  self.rate        = bidData.rate || self.rate;
  self.pricingType = bidData.pricingType || self.pricingType;
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

BidSchema.methods.notify = function(job, calllback) {
  // notify job owner of bid received
};

/*
** Static Methods
*/

BidSchema.statics.create = function(user, job, bidData, callback) {
  var self = this;
  if (!user) return callback(new Error('No user supplied'));
  if (!job) return callback(new Error('No job supplied'));
  // create the bid
  var bid = new self({
    job: job._id,
    user: user._id,
    rate: bidData.rate || job.rate,
    pricingType: bidData.pricingType || job.pricingType
  });
  bid.save(function(err) {
    if (err) return callback(err);
    callback(null, bid);
  });
};


module.exports = mongoose.model('Bid', BidSchema);
