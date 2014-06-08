/*
** cointact.me - job model
*/

var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;
var Types      = mongoose.SchemaTypes;
var hat        = require('hat');
var mailer     = require('../mailer');
var log        = require('../log');
var File       = require('../schemas/file');
var Categories = require('../categories');
var Tag        = require('./tag');
var Bid        = require('../schemas/bid');
var Comment    = require('../schemas/comment');

var JobSchema = new Schema({
  title: String,
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  contractor: { type: Schema.Types.ObjectId, ref: 'User' },
  description: String, // markdown supported
  rate: Number, // in satoshis
  pricingType: { type: String, enum: ['fixed','hourly'] },
  files: [File],
  category: { type: String, enum: Categories },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  bids: [Bid],
  comments: [Comment],
  status: { type: String, enum: ['public','open','closed'] },
  amountPaid: Number, // in satoshis
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

/*
** Instance Methods
*/
JobSchema.methods.update = function(jobData, callback) {

};

JobSchema.methods.addComment = function(commentData, callback) {

};

JobSchema.methods.placeBid = function(commentData, callback) {

};

JobSchema.methods.addFile = function(commentData, callback) {

};

/*
** Static Methods
*/

JobSchema.statics.create = function(jobData, callback) {

};

JobSchema.statics.filter = function(job) {
  return {

  }
};

module.exports = mongoose.model('Job', JobSchema);
