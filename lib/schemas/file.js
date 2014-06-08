/*
** cointact.me - file schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var hat      = require('hat');
var mailer   = require('../mailer');
var log      = require('../log');
var Job      = require('./job');

var FileSchema = new Schema({

});

/*
** Instance Methods
*/


module.exports = FileSchema;
