var log = require('./lib/log');

require('./lib/server').startAll(function(err) {
  if (err) log.err(err) && process.exit();
});
