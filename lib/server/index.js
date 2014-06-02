/*
** cointract.me - server
*/

var log          = require('../log');
var config       = require('../config');
var fs           = require('fs');
var async        = require('async');
var https        = require('https');
var express      = require('express');
var mongoose     = require('mongoose');
var types        = require('mongoose-types');
var app          = express();
var routes       = fs.readdirSync(__dirname + '/routes');

async.series(
  [
    connectDatabase,
    configureApp,
    startServer
  ],
  function(err) {
    if (err) log.err(err) && process.exit();
  }
);

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
    // load custom schema types
    types.loadTypes(mongoose);
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
  app.use(bodyParser());
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
  var serverOpts = {
    key: fs.readFileSync(config.server.ssl.key),
    cert: fs.readFileSync(config.server.ssl.cert),
    requestCert: false,
    rejectUnauthorized: false
  };

  var server = https.createServer(serverOpts, app);

  server.listen(config.server.port, config.server.host, function() {
    log.info('server started on port ' + config.server.port);
    done();
  });
};
