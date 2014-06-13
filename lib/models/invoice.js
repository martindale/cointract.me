/*
** cointract.me - invoice model
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var log      = require('../log');
var Task     = require('./task');
var async    = require('async');
var util     = require('../util');
var qrcode   = require('qrcode');
var Job      = require('./job');
var BtcAddr  = require('bitcore').Address;
var mailer   = require('../mailer');

var InvoiceSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job' },
  dateCreated: { type: Date, default: Date.now },
  datePaid: Date,
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  price: { type: Number, index: true }, // in satoshis
  address: { type: String, index: true, unique: true, required: true },
  status: { type: String, enum: ['paid','unpaid'], default: 'unpaid' },
  transactions: [{
    tx: Schema.Types.Mixed,
    type: { type: String, enum: ['match','possible'] }
  }]
});

/*
** Instance Methods
*/

InvoiceSchema.methods.logTransaction = function(tx, output, callback) {
  var self = this;
  // does the price match the value?
  var exact = (self.price === util.toSatoshis(output.value));
  self.transactions.push({
    type: exact ? 'match' : 'possible',
    tx: tx
  });
  if (exact) {
    self.status   = 'paid';
    self.datePaid = Date.now();
  }
  // save the invoice status
  self.save(function(err) {
    if (err) return callback(err);
    self.notifyPayment();
    callback(null, invoice);
  });
};

InvoiceSchema.methods.confirmPayment = function(txid, callback) {
  for (var t = 0; t < this.transactions.length; t++) {
    var tx = this.transactions[t];
    if (tx.txid === txid) {
      this.status = 'paid';
      return this.save(callback);
    }
  }
  return callback(new Error('Invalid transaction ID supplied'));
};

InvoiceSchema.methods.notifyPayment = function() {
  var self = this;
  Job.findOne({
    _id: self.job
  })
  .populate('contractor owner')
  .exec(function(err, job) {
    if (err) return log.err(err);
    if (!job) return log.err('Job ID is not valid');
    // notify owner
    mailer.send('invoice-payment', {
      to: job.owner.email,
      data: { job: job }
    }, function(err) { });
    // notify contractor
    mailer.send('invoice-payment', {
      to: job.contractor.email,
      data: { job: job }
    }, function(err) { });
  });
};

InvoiceSchema.methods.getAddressQR = function(callback) {
  qrcode.toDataURL(this.address, callback.bind(this));
};

/*
** Static Methods
*/

InvoiceSchema.statics.create = function(user, invoiceData, callback) {
  var Invoice = this;
  if (!user) return callback(new Error('Invoice requires a user._id'));
  async.waterfall(
    [
      validatePaymentAddress,
      authorizeCreation,
      validateTasks,
      validateInvoicePrice,
      createInvoice
    ],
    function(err, invoice) {
      if (err) {
        log.err(err);
        return callback(err);
      }
      callback(null, invoice);
    }
  );
  // validate the bitcoin address
  function validatePaymentAddress(next) {
    var addr = new BtcAddr(invoiceData.address);
    if (addr.isValid()) {
      Invoice.count({ address: invoiceData.address }, function(err, count) {
        if (err) return next(err);
        if (count) return next(new Error('Must use a new bitcoin address'));
        next();
      });
    }
    else {
      next(new Error('Invalid bitcoin address'));
    }
  };
  // verify that the user is the job contractor (and that both exist)
  function authorizeCreation(next) {
    Job.findOne({
      _id: invoiceData.job,
      contractor: user._id
    }, function(err, job) {
      if (err) return next(err);
      if (!job) return next(new Error('Invalid job ID'));
      next(null, job);
    });
  };
  // validate tasks (if any)
  function validateTasks(job, next) {
    if (!invoiceData.tasks || !invoiceData.tasks.length) {
      return next(null, job, []);
    }
    Task.find({
      user: user._id,
      job: job._id,
      $or: invoiceData.tasks.map(function(id) {
        return { _id: id };
      })
    }, function(err, tasks) {
      if (err) return next(err);
      if (tasks.length !== invoiceData.tasks.length) {
        return next(new Error('Invalid task(s) supplied'));
      }
      next(null, job, tasks);
    });
  };
  // function determine/validate price
  function validateInvoicePrice(job, tasks, next) {
    if (job.pricingType === 'fixed') {
      if (invoiceData.price) {
        if (invoiceData.price > (job.rate - job.amountPaid)) {
          return next(new Error('Invoice price exceeds the fixed job rate'));
        }
        return next(null, job, tasks, invoiceData.price);
      }
      // default to job rate
      return next(null, job, tasks, (job.rate - job.amountPaid));
    }
    // if hourly, then calculate based on tasks
    if (!tasks.length) {
      return next(new Error('Hourly jobs must include tasks on invoices'));
    }
    // aggregate timecards
    var time = 0;
    tasks.forEach(function(task) { time += task.get('timecard.total') });
    var price = util.toHours(time) * job.rate; // satoshis
    next(null, job, tasks, price);
  };
  // instantiate invoice
  function createInvoice(job, tasks, price, next) {
    var invoice = new Invoice({
      job: job._id,
      dateCreated: Date.now(),
      tasks: invoiceData.tasks || [],
      price: price,
      address: invoiceData.address,
      transactions: []
    });
    // save the invoice
    invoice.save(function(err) {
      if (err) return next(err);
      next(null, invoice);
    });
  };
};

InvoiceSchema.statics.reconcileTransaction = function(tx) {
  var self = this;
  log.debug('inspecting transaction', tx.txid);
  // look for invoices where the address matches any tx output addresses and
  // as well as the value output for that address
  async.parallel(
    tx.vout.map(self._reconciler.bind(self, tx)),
    function(err, results) {
      if (err) return log.err('failed to reconcile transaction', err);
      // results is a 2d array of invoices, let's concat
      var reconciled = [];
      results.forEach(function(result) {
        if (result) reconciled = reconciled.concat(result);
      });
      log.info('reconciled ' + reconciled.length + ' invoice(s)');
    }
  );
};

InvoiceSchema.statics._reconciler = function(tx, txoutput) {
  var self = this;
  // return an executor
  return function(done) {
    self.find({
      address: { $in: txoutput.scriptPubKey.addresses },
      status: 'unpaid'
    }, function(err, invoices) {
      if (err) return done(err);
      log.debug('' + invoices.length + ' possible invoices for output');
      async.each(
        invoices,
        function(invoice, done) {
          invoice.logTransaction(tx, txoutput, done);
        },
        function(err, reconciledInvoices) {
          if (err) return done(err);
          done(null, reconciledInvoices);
        });
    });
  }
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
