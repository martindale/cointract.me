/*
** cointract.me - comment schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var User     = require('./user');

var CommentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // markdown supported
  regarding: { type: Schema.Types.ObjectId, ref: 'User' } // for replies
  dateCreated: Date
});

/*
** Instance Methods
*/

CommentSchema.methods.update = function(user, content, callback) {
  var self = this;
  if (user !== self.user) return false;
  self.content = content;
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

/*
** Static Methods
*/

CommentSchema.statics.create = function(commentData, callback) {
  var Comment = this;
  // create the comment instance
  var comment = new Comment({
    user: commentData.user._id,
    content: commentData.content,
    dateCreated: Date.now()
  });
  // verify that the regarding user is valid
  if (commentData.regarding) {
    return User.findOne({ _id: commentData.regarding }, function(err, user) {
      if (err) return callback(err);
      if (!user) return callback(new Error('Invalid user ID for `regarding`'));
      comment.regarding = commentData.regarding;
      save();
    });
  }
  save();
  // shared save function
  function save() {
    comment.save(function(err) {
      if (err) return callback(err);
      callback(null, comment);
    });
  };
};

module.exports = mongoose.model('Comment', CommentSchema);
