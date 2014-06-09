/*
** cointact.me - rating model
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;

var RatingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  critic: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 5, min: 0, max: 10 },
  review: String
});

/*
** Instance Methods
*/

RatingSchema.method.update = function(callback) {

};

/*
** Static Methods
*/

RatingSchema.statics.create = function(rating, callback) {

};

module.exports = mongoose.model('Rating', RatingSchema);
