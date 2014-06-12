/*
** cointact.me - job model
*/

var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;
var Types      = mongoose.SchemaTypes;
var async      = require('async');
var fs         = require('fs');
var hat        = require('hat');
var mailer     = require('../mailer');
var log        = require('../log');
var File       = require('./file');
var categories = require('../categories');
var Tag        = require('./tag');
var Bid        = require('./bid');
var Comment    = require('./comment');
var BitPay     = require('bitpay');
var config     = require('../config');
var User       = require('./user');

var bpClient = new BitPay(fs.readFileSync(config.bitpay.secret));

bpClient.on('ready', function() {
  log.info('bitpay client ready');
});

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
  var self = this;
  // hire the bidding contractor by bidId (user must be owner)
  if (!user) return callback(new Error('User not supplied'));
  // find bid in job bids
  var bid = null;
  self.bids.forEach(function(b) {
    if (b.toString() === bidId) return bid = b;
  });
  if (!bid) return callback(new Error('Bid not valid for this job'));
  // load the bid and set the job value
  Bid.findOne({ _id: bid }).populate('user').exec(function(err, bid) {
    if (err) return callback(err);
    if (!bid) return callback('Invalid bid supplied');
    self.contractor  = user._id;
    self.pricingType = bid.pricingType;
    self.rate        = bid.rate;
    self.status      = 'open';
    // update job and notify contractor
    self.save(function(err) {
      if (err) return callback(err);
      callback(null, job);
      self.notifyHired(function(err) {
        if (err) return log.err(err);
      });
    });
  });
};

JobSchema.methods.notifyHired = function(callback) {
  var self = this;
  if (!self.contractor) return callback(new Error('No contractor to notify'));
  // get the contractor and owner emails and notify both of them
  async.parallel(
    [
      function getOwner(done) {
        User.findOne({ _id: self.owner }, function(err, user) {
          if (err) return done(err);
          if (!user) return done(new Error('Job owner not found'));
          done(null, user.email);
        });
      },
      function getContractor(done) {
        User.findOne({ _id: self.contractor }, function(err, user) {
          if (err) return done(err);
          if (!user) return done(new Error('Job contractor not found'));
          done(null, user.email);
        });
      }
    ],
    function sendNotifications(err, emails) {
      if (err) return callback(err);
      // send emails
      emails.forEach(function(email) {
        mailer.send('bid-accepted', {
          to: email,
          data: self
        }, function(err) {
          if (err) return callback(err);
          callback();
        });
      });
    }
  );
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

JobSchema.methods.getPublishURL = function() {
  var protocol = 'https://';
  var base     = config.server.host + ':' + config.server.port;
  var path     = '/jobs/' + this._id + '/activations';
  var query    = '?activationCode=' + this.listing.activationCode;
  return protocol + base + path + query;
};

JobSchema.methods.queueForPublishing = function(callback) {
  var self = this;

  async.waterfall(
    [
      createListingActivationCode,
      createBitPayInvoice
    ],
    function(err, invoice) {
      if (err) return callback(err);
      callback(null, invoice);
    }
  );

  function createListingActivationCode(next) {
    self.listing.activationCode = hat(256);
    self.save(function(err) {
      if (err) return next(err);
      next();
    });
  };

  function createBitPayInvoice(next) {
    // create bitpay invoice for job owner to pay
    bitpay.post('invoices', {
      price: config.payments.price
      currency: config.payments.currency,
      notificationURL: self.getPublishURL()
    }, function(err, invoice) {
      if (err) return next(err);
      next(null, invoice);
    });
  };

};

JobSchema.methods.publish = function(bitpayInvoice, activationCode, callback) {
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
    owner: jobData.owner,
    description: jobData.description,
    rate: jobData.rate,
    pricingType: jobData.pricingType,
    category: jobData.category
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
