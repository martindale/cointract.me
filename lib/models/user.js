/*
** cointact.me - user model
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var crypto   = require('crypto');
var hat      = require('hat');
var mailer   = require('../mailer');
var log      = require('../log');
var util     = require('../util');

require('mongoose-types').loadTypes(mongoose);

var UserSchema = new Schema({
  email: { type: Types.Email, unique: true, required: true },
  password: { type: String, required: true }, // stored as hash
  apiKey: String,
  profile: {
    firstName: String,
    lastName: String,
    username: { type: String, unique: true, required: true },
    organization: String,
    tagline: { type: String, default: 'Just another Cointractor'},
    bio: String,
    location: String,
    listed: { type: Boolean, default: false }, // show in search
    public: { type: Boolean, default: false } // allow profile views
  },
  verified: { type: Boolean, default: false },
  verificationCode: String,
  dateJoined: { type: Date, default: Date.now }
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
  var self = this;
  mailer.send('confirm-email', {
    to: self.email,
    data: {
      verificationCode: self.verificationCode
    }
  }, callback);
};

UserSchema.methods.verify = function(verificationCode, callback) {
  if (this.verified) return callback(new Error('User already verified'));
  if (verificationCode !== this.verificationCode) {
    return callback(new Error('Invalid verification code'));
  }

  this.verified         = true;
  this.verificationCode = null;

  this.save(function(err) {
    if (err) return callback(err);
    callback(null, { email: this.email });
  });
};

UserSchema.methods.updateAccount = function(accountData, callback) {
  var self = this;
  // update profile fields
  for (var p in accountData.profile || {}) {
    self.profile[p] = accountData.profile[p];
  }
  // are we changing our password?
  if (typeof accountData.password === 'object') {
    var current = accountData.password.current;
    var updated = accountData.password.new;
    return self.changePassword(current, updated, callback);
  }
  // are we verifying our email address
  if (accountData.verificationCode) {
    return self.verify(accountData.verificationCode, callback);
  }
  // otherwise just save our profile updates
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, { profile: self.profile });
  });
};

UserSchema.methods.changePassword = function(oldPass, newPass, callback) {
  if (User.hashPassword(oldPass) !== this.password) {
    return callback(new Error('Current password does not match'));
  }
  this.password = User.hashPassword(newPass);
  this.save(function(err) {
    if (err) return callback(err);
    callback(null, { profile: this.profile, message: 'Password updated' });
  });
};

/*
** Static Methods
*/

UserSchema.statics.create = function(userData, callback) {
  var user = new this(userData);
  var pass = userData.password;
  // make sure we have a password
  if (!pass) return callback(new Error('Invalid password supplied'));
  // make sure we set explicit values for some important things
  user.verified         = false;
  user.verificationCode = hat(256);
  user.apiKeys          = [];
  // store our encrypted password
  user.password = this.hashPassword(pass);
  // generate our first apikey
  user.createApiKey();
  // save our user and send a verification email
  user.save(function(err) {
    if (err) return callback(err);
    log.info('user registered: ' + user.email);
    user.sendVerificationEmail(function(err) {
      if (err) log.err(err);
    });
    callback(null, {
      email: user.email,
      verified: user.verified
    });
  });
};

UserSchema.statics.hashPassword = function(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
};

UserSchema.statics.getApiKey = function(username, password, callback) {
  if (!username || !password) {
    return callback(new Error('Invalid username or password'));
  }
  this.findOne({
    'profile.username': username,
    password: this.hashPassword(password)
  })
  .exec(function(err, user) {
    if (err) return callback(err);
    if (!user) return callback(new Error('Invalid username or password'));
    if (!user.verified) return callback(new Error('Email not yet verified'));
    callback(null, user.apiKey);
  });
};

UserSchema.statics.filter = function(user) {
  return {
    email: user.email,
    verified: user.verified,
    profile: user.profile
  }
};

module.exports = mongoose.model('User', UserSchema);
