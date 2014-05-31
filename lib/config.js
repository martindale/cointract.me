var log        = require('./log');
var path       = require('path');
var configPath = path.join(__dirname, '../config.json')
var env        = 'env_' + (process.env.NODE_ENV || 'development');
// load in our config file
try {
  var conf = require(configPath);
}
catch(err) {
  log.err('No configuration file found at ' + configPath);
  process.exit();
}
// make sure the env is defined in the config
if (typeof conf[env] === 'undefined') {
  log.err('No configuration for environment `' + env + '`.');
  process.exit();
}
// expose the config for this environment (default to dev)
module.exports = conf[env];
