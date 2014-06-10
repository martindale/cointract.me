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

BidSchema.methods.update = function(user, rate, pricingType) {
  if (user._id !== this.user) return this;
  this.rate        = rate || this.rate;
  this.pricingType = pricingType || this.pricingType;
  return this;
};

/*
** Static Methods
*/

BidSchema.statics.create = function(bidData) {
  
};


module.exports = BidSchema;
