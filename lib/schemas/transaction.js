/*
** cointact.me - transaction schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;

var TransactionSchema = new Schema({

});

/*
** Static Methods
*/

TransactionSchema.statics.create = function(txData) {
  return new self(txData);
};

module.exports = TransactionSchema;
