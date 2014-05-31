/*
** cointract.me - server
*/

var log      = require('../log');
var config   = require('../config');
var fs       = require('fs');
var https    = require('https');
var express  = require('express');
var mongoose = require('mongoose');
var app      = express();
var routes   = fs.readdirSync(__dirname + '/routes');

// mount routes to server
routes.forEach(function(route) {
  try {
    require(__dirname + '/routes/' + route)(app);
  }
  catch(err) {
    log.err('failed to bind route "' + route + '"');
  }
});

// open database connection
var databaseOpts = {
  user: config.database.user,
  pass: config.database.pass
};

var databaseUris = config.database.nodes.map(function(node) {
  var protocol = 'mongodb://';
  var uri      = node.host + ':' + node.port;
  var path     = '/' + config.database.name;
  return protocol + uri + path;
});

mongoose.connect(databaseUris.join(), databaseOpts, function(err) {
  if (err) {
    return log.err('failed to connect to database "' + config.database.name);
  }
  log.info('connected to database "' + config.database.name + '"');
});

// fire up the server
var serverOpts = {
  key: fs.readFileSync(config.server.ssl.key),
  cert: fs.readFileSync(config.server.ssl.cert),
  requestCert: false,
  rejectUnauthorized: false
};

var server = https.createServer(serverOpts, app);

server.listen(config.server.port, config.server.host, function() {
  log.info('server started on port ' + config.server.port);
});
