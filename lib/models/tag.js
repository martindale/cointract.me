/*
** cointact.me - tag model
*/

var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;
var Types      = mongoose.SchemaTypes;

var TagSchema = new Schema({
  name: { type: String, required: true, unique: true },
  popularity: Number // times used
});

/*
** Instance Methods
*/



/*
** Static Methods
*/

TagSchema.statics.create = function(tag, callback) {
  var self    = this;
  var tagName = tag.toLowerCase();
  // see if we already have the tag
  self.findOne({ name: tagName }).exec(function(err, tag) {
    if (err) return callback(err);
    if (tag) {
      tag.popularity += 1;
      return tag.save(function(err) {
        if (err) return callback(err);
        callback(null, tag);
      });
    }
    // create it if it doesn't exist
    var tag = new self({ name: tagName, popularity: 1 });
    // and save it
    tag.save(function(err) {
      if (err) return callback(err);
      callback(null, tag);
    });
  });
};

module.exports = mongoose.model('Tag', TagSchema);
