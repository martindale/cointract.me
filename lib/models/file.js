/*
** cointract.me - file schema
*/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Types    = mongoose.SchemaTypes;
var hat      = require('hat');
var log      = require('../log');
var config   = require('../config');
var pkgcloud = require('pkgcloud');
var async    = require('async');

var rackspace = pkgcloud.storage.createClient({
  provider: config.storage.provider,
  username: config.storage.username,
  apiKey: config.storage.apiKey,
  region: config.storage.region
});

var FileSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  url: String,
  visibility: { type: String, enum: ['public','private'], default: 'private' },
  note: String
});

/*
** Instance Methods
*/

FileSchema.statics.edit = function(note, callback) {
  var self = this;
  self.note = note;
  self.save(function(err) {
    if (err) return callback(err);
    callback(null, self);
  });
};

FileSchema.statics.destroy = function(callback) {
  var self = this;
  // remove the file from storage
  var container = config.storage.container;
  rackspace.removeFile(container, self.name, function(err, result) {
    if (err) return callback(err);
    if (!result) return callback(new Error('Failed to destroy file'));
    self.remove(callback);
  });
};

/*
** Static Methods
*/

FileSchema.statics.create = function(user, fileData, callback) {
  var self = this;

  async.waterfall([
    createFileObject,
    getRemoteContainer,
    uploadFile,
    saveFileObject
  ], callback);

  function createFileObject(next) {
    var file = new self({
      owner: user._id,
      name: fileData.name + '-' + Date.now() + '-' + hat(),
      visibility: fileData.visibility,
      note: fileData.note
    });
    next(null, file);
  };

  function getRemoteContainer(file, next) {
    rackspace.getContainer(config.storage.container, function(err, con) {
      if (err) return next(err);
      file.url = con.cdnSslUri + '/' + file.name;
      next(null, file);
    });
  };

  function uploadFile(file, next) {
    rackspace.upload({
      container: config.storage.container,
      remote: file.name,
      stream: fileData.stream
    }, function(err, result) {
      if (err) return next(err);
      if (!result) return next(new Error('Upload failed'));
      next(null, file);
    });
  };

  function saveFileObject(file, next) {
    file.save(function(err) {
      if (err) return next(err)
      next(null, file);
    });
  };

};

FileSchema.statics._client = rackspace;

module.exports = mongoose.model('File', FileSchema);