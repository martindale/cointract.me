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

RatingSchema.method.update = function(rating, callback) {
  var self = this;
  // only update these fields
  self.review = rating.review || this.review;
  self.score  = rating.score || this.score;
  // return the updated rating
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

/*
** Static Methods
*/

RatingSchema.statics.create = function(user, data, callback) {
  // make sure one doesn't already exist for the user/critic
  this.findOne({ critic: user._id, user: data.user }, function(err, rating) {
    if (err) return callback(err);
    if (rating) return rating.update(data, callback);
    var rating = new self({
      critic: user._id,
      user: data.user,
      score: data.score,
      review: data.review
    });
    rating.save(function(err) {
      if (err) return callback(err);
      callback(null, rating);
    });
  });
};

module.exports = mongoose.model('Rating', RatingSchema);
