/*
** cointract.me - file schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var hat      = require('hat');
var log      = require('../log');

var FileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  location: String, // uri of resource
  visibility: { type: String, enum: ['public','private'] },
  note: String
});

/*
** Instance Methods
*/

FileSchema.statics.update = function(fileData, callback) {

};

FileSchema.statics.destroy = function(callback) {

};

/*
** Static Methods
*/

FileSchema.statics.create = function(stream, fileData, callback) {

};

module.exports = FileSchema;
