/*
** cointract.me - logger module
*/

var config = require('./config');
var color  = require('cli-color');
var prefix = color.underline.bold('{cointract.me}');

module.exports = {
  info: function(msg, data) {
    return console.log(prefix, color.blue('{info}'), msg, data || '');
  },
  err: function(msg, data) {
    return console.log(prefix, color.red('{error}'), msg, data || '');
  },
  warn: function(msg, data) {
    return console.log(prefix, color.yellow('{warning}'), msg, data || '');
  },
  debug: function(msg, data) {
    if (config.debug) {
      return console.log(prefix, color.magenta('{debug}'), msg, data || '');
    }
  }
};
