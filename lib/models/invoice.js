/*
** cointact.me - invoice model
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var log      = require('../log');
var Task     = require('./task');
var async    = require('async');
var util     = require('../util');
var qrcode   = require('qrcode');

var InvoiceSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job' },
  dateCreated: { type: Date, default: Date.now },
  datePaid: Date,
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  price: { type: Number, index: true }, // in satoshis
  address: { type: String, index: true }, // validate with bitcore
  status: { type: String, enum: ['paid','unpaid'], default: 'unpaid' },
  transactions: [{
    tx: Schema.Types.Mixed,
    type: { type: String, enum: ['match','possible'] }
  }]
});

/*
** Instance Methods
*/

InvoiceSchema.methods.logTransaction = function(tx, callback) {

};

InvoiceSchema.methods.getAddressQR = function(callback) {
  qrcode.toDataURL(this.address, callback.bind(this));
};

/*
** Static Methods
*/

InvoiceSchema.statics.create = function(invoiceData, callback) {

};

InvoiceSchema.statics.reconcileTransaction = function(tx) {
  var self = this;
  log.debug('reconciling transaction', tx.txid);
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
      log.debug('reconciled ' + reconciled.length + ' invoice(s)');
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
      log.debug('found ' + invoices.length + ' possible invoices to reconcile');
      async.each(
        invoices,
        function(invoice, done) {
          // does the price match the value?
          var exact = (invoice.price === util.toSatoshi(txoutput.value));
          invoice.transactions.push({
            type: exact ? 'match' : 'possible',
            tx: tx
          });
          if (exact) invoice.status = 'paid';
          // save the invoice status
          invoice.save(function(err) {
            if (err) return done(err);
            invoice.notifyPayment();
            done(null, invoice);
          });
        },
        function(err, reconciledInvoices) {
          if (err) return done(err);
          done(null, reconciledInvoices);
        });
    });
  }
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
