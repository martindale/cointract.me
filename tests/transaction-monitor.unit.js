var should     = require('should');
var sinon      = require('sinon');
var proxyquire = require('proxyquire');
var config     = require('../lib/config');

describe('TransactionMonitor', function() {

  var TransactionMonitor = proxyquire('../lib/transaction-monitor', {
    request: sinon.stub().callsArgWith(1, null, {}, '{}')
  });

  var txid = '54c661ba7cee28107bdd20d9a30661bbb24fc08e26cd491b07cdbabac99ef3fa';

  var monitor = new TransactionMonitor({
    host: config.insight.host,
    port: config.insight.port,
    path: config.insight.path
  });

  describe('#getTransactionById', function() {

    it('should get the transaction and parse it', function(done) {
      monitor.getTransactionById(txid, function(err, tx) {
        should.not.exist(err);
        should.exist(tx);
        done();
      });
    });

  });

  describe('#handleTransaction', function() {

    it('should emit an event when a transaction occurs', function(done) {
      monitor.once('transaction', function(tx) {
        should.exist(tx);
        done();
      });
      monitor.handleTransaction({ txid: txid });
    });

  });

  describe('#handleDisconnect', function() {

    it('should emit an event when the connection is lost', function(done) {
      monitor.once('disconnect', done);
      monitor.handleDisconnect();
    });

  });

});
