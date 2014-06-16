var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var proxyquire = require('proxyquire');
var sinon      = require('sinon');

mockgoose(mongoose);

describe('File', function() {

  var File = proxyquire('../../lib/models/file', {
    pkgcloud: { storage: { createClient: sinon.stub().returns({
      removeFile: sinon.stub().callsArgWith(2, null, true),
      getContainer: sinon.stub().callsArgWith(1, null, {
        cdnSslUri: 'https://filehost.fake'
      }),
      upload: sinon.stub().callsArgWith(1, null, true)
    }) } }
  });

  var user1  = { _id: new mongoose.Types.ObjectId() };
  var user2  = { _id: new mongoose.Types.ObjectId() };
  var file   = null;
  var stream = new require('stream').Readable();

  describe('#create', function() {

    it('should upload file stream and create a file object', function(done) {
      File.create(user1, {
        name: 'yourmom.jpg',
        visibility: 'public',
        note: 'what a good night!',
        stream: stream
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.note.should.equal('what a good night!');
        result.visibility.should.equal('public');
        file = result;
        done();
      });
    });

  });

  describe('#edit', function() {

    it('should update the file note', function(done) {
      file.edit(user1, {
        note: 'what a great night!'
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.note.should.equal('what a great night!');
        done();
      });
    });

    it('should not allow a user to edit another\'s file', function(done) {
      file.edit(user2, {
        note: 'what a great night!'
      }, function(err, result) {
        should.exist(err);
        done();
      });
    });

  });

  describe('#destroy', function() {



  });

});
