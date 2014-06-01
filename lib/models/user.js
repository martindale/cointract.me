/*
** cointact.me - user model
*/

var mongoose      = require('mongoose');
var Schema        = mongoose.Schema;
var Types         = mongoose.SchemaTypes;
var crypto        = require('crypto');
var hat           = require('hat');
var mailer        = require('../mailer');

var UserSchema = new Schema({
  email: { type: Types.Email, unique: true, required: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String, required: true }, // stored as hash (named for validation)
  apiKey: String,
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    organization: String,
    tagline: { type: String, default: 'Just another Cointractor'},
    bio: String,
    location: String,
    listed: { type: Boolean, default: false }, // show in search
    public: { type: Boolean, default: false } // allow profile views
  },
  verified: { type: Boolean, default: false },
  verificationCode: String
});

UserSchema.virtual('profile.gravatar').get(function() {
  var baseUrl   = 'https://gravatar.com/avatar/';
	var emailHash = crypto.createHash('md5').update(email).digest('hex');
  return baseUrl + emailHash.toString();
});

/*
** Instance Methods
*/

UserSchema.methods.createApiKey = function() {
  // key is the doc id, timestamp, and random 512 byte string
  var key = '' + this._id + Date.now() + hat(512);
  // encrypt the key string
  key = crypto.createHash('sha256').update(key).digest('hex');
  // create the key and add it to the set
  this.apiKey = key;
  // save the document and pass the key to the callback
  return this.apiKey;
};

UserSchema.methods.sendVerificationEmail = function(callback) {
  mailer.send('confirm-email', this.toObject(), callback);
};

UserSchema.methods.verify = function(verificationCode, callback) {
  if (this.verified) return callback(new Error('User already verified'));
  if (verificationCode !== this.verificationCode) {
    return callback(new Error('Invalid verification code'));
  }
  this.verified = true;
  this.save(callback);
};

/*
** Static Methods
*/
var User = mongoose.model('User', UserSchema);

UserSchema.statics.create = function(userData, callback) {
  var user = new User(userData);
  var pass = userData.password;
  // make sure we set explicit values for some important things
  user.verified         = false;
  user.verificationCode = hat(256);
  user.apiKeys          = [];
  // store our encrypted password
  user.password = User.hashPassword(pass);
  // generate our first apikey
  user.createApiKey();
  // save our user and send a verification email
  user.save(function(err) {
    if (err) return callback(err);
    user.sendVerificationEmail(function(err) {
      if (err) log.err(err);
    });
    callback(null, {
      message: 'Verification email sent to ' + user.email
    });
  });
};

UserSchema.statics.hashPassword = function(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
};

module.exports = User;
