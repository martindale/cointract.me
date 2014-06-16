var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var proxyquire = require('proxyquire');
var sinon      = require('sinon');

mockgoose(mongoose);

describe('Invoice', function() {

  var Invoice = require('../../lib/models/invoice');
  var user1   = { _id: new mongoose.Types.ObjectId() };
  var invoice = null;

  describe('#create', function() {

    it('', function(done) {

    });

  });

});
