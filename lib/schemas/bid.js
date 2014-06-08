/*
** cointact.me - bid schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var hat      = require('hat');
var mailer   = require('../mailer');
var log      = require('../log');
var Job      = require('./job');

var BidSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  rate: Number, // in satoshis
  pricingType: { type: String, enum: ['fixed','hourly'] }
});

/*
** Instance Methods
*/

BidSchema.methods.update = function(rate, pricingType) {
  this.rate        = rate || this.rate;
  this.pricingType = pricingType || this.pricingType;
  return this;
};

/*
** Static Methods
*/

BidSchema.statics.create = function(bidData) {
  return new this(bidData);
};


module.exports = BidSchema;
