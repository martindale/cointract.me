/*
** cointract.me - comment schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;

var CommentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // markdown supported
  regarding: { type: Schema.Types.ObjectId, ref: 'User' } // for replies
});

/*
** Instance Methods
*/

CommentSchema.methods.update = function(user, content) {
  if (user !== this.user) return false;
  this.content = content;
  return this;
};

/*
** Static Methods
*/

CommentSchema.statics.create = function(commentData) {
  
};

module.exports = mongoose.model('Comment', CommentSchema);
