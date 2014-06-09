/*
** cointract.me - transaction monitor
*/

var config       = require('./config');
var color        = require('cli-color');
var io           = require('socket.io-client');
var request      = require('request');
var log          = require('./log');
var inherits     = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var TransactionMonitor = function(options) {
  this.protocol = 'http://';
  this.host     = options.host;
  this.port     = options.port;
  this.path     = options.path;
  this.identity = color.yellow('{tx monitor}');
};

inherits(TransactionMonitor, EventEmitter);

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
  var self = this;
  if (config.insight.verbose) {
    log.info(self.identity, 'id: ' + tx.txid + ' - value: ' + tx.valueOut);
  }
  self.getTransactionById(tx.txid, function(err, tx) {
    if (err) return self.emit('error', err);
    self.emit('transaction', tx);
  });
};

TransactionMonitor.prototype.handleDisconnect = function() {
  log.warn(this.identity, 'disconnected');
  this.emit('disconnect');
};

TransactionMonitor.prototype.getTransactionById = function(txid, callback) {
  var url = this.protocol + this.host + ':' + this.port;
  request(url + '/api/tx/' + txid, function(err, response, body) {
    if (err) return callback(err);
    callback(null, JSON.parse(body));
  });
};

module.exports = new TransactionMonitor({
  host: config.insight.host,
  port: config.insight.port,
  path: config.insight.path
});
