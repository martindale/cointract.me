/*
** cointract.me - transaction monitor
*/

var config = require('./config');
var color  = require('cli-color');
var io     = require('socket.io-client');
var log    = require('./log');

var TransactionMonitor = function(options) {
  this.protocol = 'http://';
  this.host     = options.host;
  this.port     = options.port;
  this.path     = options.path;
  this.identity = color.yellow('{tx monitor}');
};

TransactionMonitor.prototype.start = function(callback) {
  var self = this;
  var uri  = this.protocol + this.host + ':' + this.port + this.path;

  self.socket = io.connect(uri);

  self.socket.on('error', function(err) {
    if (callback) return callback(err);
  });

  self.socket.on('connect', function() {
    self.socket.on('disconnect', self.handleDisconnect.bind(self));
    // for whatever reason insight wants us to specifically subscribe to the
    // `inv` room to receive updates
    self.socket.emit('subscribe', 'inv');
    self.socket.on('tx', self.handleTransaction.bind(self));
    return callback(null, uri);
  });
};

TransactionMonitor.prototype.handleTransaction = function(tx) {
  if (config.insight.verbose) {
    log.info(this.identity, 'id: ' + tx.txid + ' | value: ' + tx.valueOut);
  }
  // do invoice reconcilliation
};

TransactionMonitor.prototype.handleDisconnect = function() {
  log.warn(this.identity, 'disconnected');
};

module.exports = new TransactionMonitor({
  host: config.insight.host,
  port: config.insight.port,
  path: config.insight.path
});
