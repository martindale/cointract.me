/*
** cointract.me - server
*/

var log                = require('../log');
var config             = require('../config');
var TransactionMonitor = require('../transaction-monitor');
var fs                 = require('fs');
var async              = require('async');
var https              = require('https');
var http               = require('http');
var express            = require('express');
var mongoose           = require('mongoose');
var app                = express();
var routes             = fs.readdirSync(__dirname + '/routes');

module.exports = {
  startAll: function(callback) {
    async.series([
      connectDatabase,
      configureApp,
      startServer,
      startRedirector,
      startTransactionMonitor
    ], function(err) {
      if (callback) return callback(err);
    });
  },
  connectDatabase: connectDatabase,
  configureApp: configureApp,
  startServer: startServer,
  startRedirector: startRedirector,
  startTransactionMonitor: startTransactionMonitor
};

function connectDatabase(done) {
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
      return done('failed to connect to database "' + config.database.name);
    }
    log.info('connected to database "' + config.database.name + '"');
    done()
  });
};

function configureApp(done) {
  // app configuration
  app.set('view engine', 'jade');
  app.set('views', process.cwd() + '/lib/client/views');
  app.set('x-powered-by', false);

  // apply connect/express middleware
  var bodyParser     = require('body-parser');
  var methodOverride = require('method-override');
  var favicon        = require('serve-favicon');
  var cookieParser   = require('cookie-parser');
  var authenticate   = require('./middleware/authenticate');
  var errorHandler   = require('./middleware/error-handler');

  // app.use(favicon(process.cwd() + '/lib/client/assets/images/favicon.ico'));
  app.use(express.static(process.cwd() + '/lib/client/assets'));
  app.use(bodyParser({ limit: '5mb' }));
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(authenticate);
  app.use(errorHandler);

  // mount routes to server
  routes.forEach(function(route) {
    try {
      require(__dirname + '/routes/' + route)(app);
    }
    catch(err) {
      log.err('failed to bind route "' + route + '"', err);
    }
  });

  // add 404 route
  app.get('*', function(req, res){
    res.render('not-found');
  });

  done();
};

function startServer(done) {
  // fire up the server
  var useSSL     = config.server.ssl.enabled;
  var server     = null;

  if (useSSL) {
    server = https.createServer({
      key: fs.readFileSync(config.server.ssl.key),
      cert: fs.readFileSync(config.server.ssl.cert),
      requestCert: false,
      rejectUnauthorized: false
    }, app);
  }
  else {
    server = http.createServer(app);
  }

  server.listen(config.server.port, config.server.host, function() {
    log.info('server started on port ' + config.server.port);
    done();
  });
};

function startRedirector(done) {
  var forceSSL   = require('./middleware/force-ssl');
  var redirector = http.createServer(express().use(forceSSL));

  redirector.listen(config.server.redirectPort, config.server.host, function() {
    log.info('redirector started on port ' + config.server.redirectPort);
    done();
  });
};

function startTransactionMonitor(done) {
  var Invoice = require('../models/invoice');
  var monitor = new TransactionMonitor({
    host: config.insight.host,
    port: config.insight.port,
    path: config.insight.path
  });
  // start the monitor
  monitor.start(function(err, uri) {
    if (err) log.err(err);
    done();
  });
  // setup invoice reconcilliation
  monitor.on('transaction', function(tx) {
    Invoice.reconcileTransaction(tx);
  });
};
