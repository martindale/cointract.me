/*
** cointract.me - logger module
*/

var color  = require('cli-color');
var prefix = color.underline.bold('{cointract.me}');

module.exports = {
  info: function(msg) {
    return console.log(prefix, color.blue('{info}'), msg);
  },
  err: function(msg) {
    return console.log(prefix, color.red('{error}'), msg);
  },
  warn: function(msg) {
    return console.log(prefix, color.yellow('{warning}'), msg);
  }
};
