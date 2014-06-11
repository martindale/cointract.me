/*
** cointact.me - job model
*/

var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;
var Types      = mongoose.SchemaTypes;
var async      = require('async');
var hat        = require('hat');
var mailer     = require('../mailer');
var log        = require('../log');
var File       = require('./file');
var categories = require('../categories');
var Tag        = require('./tag');
var Bid        = require('./bid');
var Comment    = require('./comment');

var statuses = [
  'public',  // open for bidding
  'private', // not yet published
  'open',    // contractor hired - now private
  'closed'   // contractor hired and completed - still private
];

var JobSchema = new Schema({
  title: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  contractor: { type: Schema.Types.ObjectId, ref: 'User' },
  description: String, // markdown supported
  rate: Number, // in satoshis
  pricingType: { type: String, enum: ['fixed','hourly'] },
  files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  category: { type: String, enum: Object.keys(categories), required: true },
  subCategory: String, // should be constrained by main category
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  bids: [{ type: Schema.Types.ObjectId, ref: 'Bid' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  status: { type: String, enum: statuses, default: 'private' },
  amountPaid: { type: Number, default: 0 }, // in satoshis
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dateCreated: { type: Date, default: Date.now },
  listing: {
    active: { type: Boolean, default: false },
    activationCode: String,
    start: Date,
    end: Date
  }
});

/*
** Instance Methods
*/
JobSchema.methods.update = function(jobData, callback) {
  var self    = this;
  var allowed = [
    'title',
    'description',
    'category',
    'subCategory',
    'tags'
  ];
  // if we haven't hired a contractor yet, then we can update these arbitrarily
  if (!self.contractor) {
    allowed = allowed.concat(['rate','pricingType']);
  }
  // update allowed fields
  allowed.forEach(function(field) {
    if (jobData[field]) {
      // special case for category/subcategory
      if (field === 'subCategory') {
        if (!~categories[self.category].indexOf(jobData[field])) {
          return self[field] = null;
        }
      }
      self[field] = jobData[field];
    }
  });
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

// TODO - consider using molecule framework
JobSchema.methods.addComment = function(user, commentData, callback) {
  var self = this;
  if (!user) return callback(new Error('No user supplied'));
  // create comment
  Comment.create(user, commentData, function(err, comment) {
    if (err) return callback(err);
    self.comments.addToSet(comment._id);
    self.save(function(err) {
      if (err) return callback(err);
      callback(null, comment);
    });
  });
};

// TODO - consider using molecule framework
JobSchema.methods.placeBid = function(user, bidData, callback) {
  var self = this;
  if (!user) return callback(new Error('No user supplied'));
  // create bid
  Bid.create(user, self._id, {
    rate: bidData.rate || self.rate,
    pricingType: bidData.pricingType || self.pricingType
  }, function(err, bid) {
    if (err) return callback(err);
    self.bids.addToSet(bid._id);
    self.save(function(err) {
      if (err) return callback(err);
      callback(null, bid);
    });
  });
};

// TODO - consider using molecule framework
JobSchema.methods.addFile = function(user, stream, fileData, callback) {
  var self = this;
  var ReadableStream = require('stream').Readable;
  // validation
  if (!user) return callback(new Error('No user supplied'));
  if (!stream || !(stream instanceof ReadableStream)) {
    return callback(new Error('Not a valid file stream'));
  }
  // create the file instance
  File.create(user, {
    name: fileData.name || 'file',
    note: fileData.note,
    stream: stream
  }, function(err, file) {
    if (err) return callback(err);
    // reference the file in this job
    self.files.addToSet(file._id);
    self.save(function(err) {
      if (err) return callback(err);
      callback(null, file);
    });
  });
};

JobSchema.methods.acceptBid = function(user, bidId, callback) {
  // hire the bidding contractor by bidId (user must be owner)
};

JobSchema.methods.watch = function(user, callback) {
  // add user to watchers
  this.watchers.addToSet(user._id);
  this.save(function(err) {
    if (err) return callback(err);
    callback(null, job);
  });
};

JobSchema.methods.unwatch = function(user, callback) {
  // remove user from watchers
  this.watchers.removeFromSet(user._id);
  this.save(function(err) {
    if (err) return callback(err);
    callback(null, job);
  });
};

JobSchema.methods.queueForPublishing = function(callback) {
  // create bitpay invoice for job owner to pay
};

JobSchema.methods.publish = function(bitpayInvoice, callback) {
  // set listing to active if bitpay invoice is paid
  // send notification email to owner
};

/*
** Static Methods
*/

JobSchema.statics.create = function(user, jobData, callback) {
  var self = this;
  if (!user) return callback(new Error('No user supplied'));
  // limit the data used to create the job
  var job = new self({
    title: jobData.title,
    owner: ,
    description: ,
    rate: ,
    pricingType: ,
    category:
  });
  // check for subcategories
  if (!categories[jobData.category]) {
    return callback(new Error('Invalid category supplied'));
  }
  if (jobData.subCategory) {
    if (~categories[jobData.category].indexOf(jobData.subCategory)) {
      return callback(new Error('Invalid subCategory supplied.'));
    }
    job.subCategory = jobData.subCategory;
  }
  // create tags
  async.eachSeries(jobData.tags || [], function(tag, done) {
    Tag.create(tag, done);
  }, function(err, results) {
    job.tags = results.map(function(tag) { return tag._id });
    job.save(function(err) {
      if (err) return callback(err);
      callback(null, job);
    });
  });
};

module.exports = mongoose.model('Job', JobSchema);
