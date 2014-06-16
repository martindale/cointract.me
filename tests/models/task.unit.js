var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var proxyquire = require('proxyquire');
var sinon      = require('sinon');

mockgoose(mongoose);

describe('Task', function() {

  var Task  = require('../../lib/models/task');
  var user1 = { _id: new mongoose.Types.ObjectId() };
  var task  = null;

  describe('#create', function() {

    it('', function(done) {

    });

  });

});
