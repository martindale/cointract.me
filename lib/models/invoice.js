/*
** cointact.me - invoice model
*/

var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;
var Types       = mongoose.SchemaTypes;
var Task        = require('./task');
var Transaction = require('../schemas/transaction');

var InvoiceSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job' },
  dateCreated: { type: Date, default: Date.now },
  datePaid: Date,
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  price: Number, // in satoshis
  address: { type: String, index: true }, // validate with bitcore
  status: { type: String, enum: ['paid','unpaid'], default: 'unpaid' },
  transactions: [Transaction]
});

/*
** Instance Methods
*/

InvoiceSchema.method.logTransaction = function(tx, callback) {

};

/*
** Static Methods
*/

InvoiceSchema.statics.create = function(invoiceData, callback) {

};

module.exports = mongoose.model('Invoice', InvoiceSchema);
