var should     = require('should');
var sinon      = require('sinon');
var proxyquire = require('proxyquire');
var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');

mockgoose(mongoose);

describe('Server', function() {

  var app = proxyquire('../lib/server', {
    '../transaction-monitor': sinon.stub().returns({
      start: sinon.stub().callsArgWith(0, null, ''),
      on: sinon.stub()
    }),
    'https': {
      createServer: sinon.stub().returns({
        listen: sinon.stub().callsArg(2)
      })
    },
    'http': {
      createServer: sinon.stub().returns({
        listen: sinon.stub().callsArg(2)
      })
    }
  });

  describe('#connectDatabase', function() {
    it('should connect to the database', app.connectDatabase);
  });

  describe('#configureApp', function() {
    it('should configure the express instance', app.configureApp);
  });

  describe('#startServer', function() {
    it('should start the https server', app.startServer);
  });

  describe('#startRedirector', function() {
    it('should start the http redirector', app.startRedirector);
  });

  describe('#startTransactionMonitor', function() {
    it('should start the transaction monitor', app.startTransactionMonitor);
  });

});
