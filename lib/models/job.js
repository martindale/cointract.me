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
var config     = require('../config');
var User       = require('./user');
var util       = require('../util');
var soop       = require('soop');
var BitPay     = soop.load('bitpay', { config: config.bitpay.client });
var KeyUtils   = require('bitpay/lib/key-utils');

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
  category: { type: String, enum: Object.keys(categories), required: true },
  subCategory: String, // should be constrained by main category
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  status: { type: String, enum: statuses, default: 'private' },
  amountPaid: { type: Number, default: 0 }, // in satoshis
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  dateCreated: { type: Date, default: Date.now },
  listing: {
    active: { type: Boolean, default: false },
    activationCode: String,
    start: Date,
    end: Date
  },
  invoices: [Schema.Types.Mixed]
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

JobSchema.methods.acceptBid = function(bid, callback) {
  var self = this;
  if (!bid) return callback('Invalid bid supplied');
  self.contractor  = bid.user;
  self.pricingType = bid.pricingType;
  self.rate        = bid.rate;
  self.status      = 'open';
  // update job and notify contractor
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
    self.notifyHired(function(err) {
      if (err) return log.err(err);
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
  var self = this;
  // add user to watchers
  self.watchers.addToSet(user._id);
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

JobSchema.methods.unwatch = function(user, callback) {
  var self = this;
  // remove user from watchers
  self.watchers.pull(user._id);
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

JobSchema.methods.getPublishURL = function() {
  var protocol = 'https://';
  var base     = config.server.host + ':' + config.server.port;
  var path     = '/jobs/' + this._id + '/activations';
  var query    = '?activationCode=' + this.listing.activationCode;
  return protocol + base + path + query;
};

JobSchema.methods.queueForPublishing = function(listStart, listEnd, callback) {
  var self = this;

  async.waterfall(
    [
      setListingTime,
      createListingActivationCode,
      createBitPayInvoice
    ],
    function(err) {
      if (err) return callback(err);
      callback(null, self);
    }
  );

  function setListingTime(next) {
    var start = new Date(listStart);
    var end   = new Date(listEnd);
    // verify valid range
    if (start > end) return callback(new Error('Invalid listing date range'));
    if (start < new Date()) {
      return callback(new Error('Start must be in the future'));
    }
    // set and save
    self.listing.start = start;
    self.listing.end   = end;
    self.save(function(err) {
      if (err) return next(err)
      next();
    });
  };

  function createListingActivationCode(next) {
    self.listing.activationCode = hat(256);
    self.save(function(err) {
      if (err) return next(err);
      next();
    });
  };

  function createBitPayInvoice(next) {
    // calculate number of days for listing
    var days = (self.listing.end - self.listing.start) / util.days(1);
    // are we enforcing payments for job postings?
    if (!config.payments.price || process.env.TEST) {
      next();
      return setTimeout(function() {
        // don't create a bitpay invoice, just publish
        self.publish({ status: 'paid' }, self.listing.activationCode, next);
      }, 1000);
    }
    // otherwise create the invoice
    fs.readFile(config.bitpay.secret, function(err, buf) {
      if (err) return next(err);
      var key      = buf.toString();
      var secret   = KeyUtils.decrypt(config.bitpay.client.keyPassword, key);
      var bpClient = new BitPay(secret);
      // set up bitpay client
      bpClient.on('error', next).on('ready', function() {
        // create bitpay invoice for job owner to pay
        bpClient.post('invoices', {
          price: days * config.payments.price,
          currency: config.payments.currency,
          notificationURL: self.getPublishURL()
        },
        function(err, invoice) {
          if (err) return next(err);
          self.invoices.addToSet(invoice);
          self.save(next)
        });
      });
    });
  };

};

JobSchema.methods.publish = function(bitpayInvoice, activationCode, callback) {
  var self          = this;
  var mailData      = { job: self };
  var validStatuses = ['complete','confirmed','paid'];
  //  verfy activation code
  if (!activationCode || activationCode !== self.listing.activationCode) {
    return callback(new Error('Invalid activation code'));
  }
  // if underpaid then reduce listing time to amount paid
  // if overpaid then increment listing time to amount paid
  if (bitpayInvoice.exceptionStatus) {
    var daysPaid = Number(bitpayInvoice.btcPaid) / config.payments.price;
    // set listing end date and save
    self.listing.end   = new Date(self.listing.start + util.days(daysPaid));
    mailData.exception = daysPaid;
  }
  // set listing to active if bitpay invoice is paid
  if (~validStatuses.indexOf(bitpayInvoice.status)) {
    self.listing.active = true;
    // update the stored invoice
    for (var i = 0; i < self.invoices.length; i++) {
      if (self.invoices[i].id === bitpayInvoice.id) {
        self.invoice[i] = bitpayInvoice;
      }
    }
    // save and notify the owner
    return self.save(function(err) {
      if (err) return callback(err);
      callback(null, self);
      // send notification email to owner
      User.findOne({ _id: self.owner }, function(err, user) {
        if (err) return log.err(err);
        if (!user) return log.err(new Error('Could not find job owner'));
        mailer.send('job-published', {
          to: user.email,
          data: mailData
        }, function(err) {
          if (err) return log.err(err);
        });
      });
    });
  }
  callback(new Error('' + bitpayInvoice.status + ' is not valid'));
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
    owner: user._id,
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
    if (!~categories[jobData.category].indexOf(jobData.subCategory)) {
      return callback(new Error('Invalid subCategory supplied.'));
    }
    job.subCategory = jobData.subCategory;
  }
  // create tags
  async.map(jobData.tags || [], function(tag, done) {
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
