/*
** cointract.me - utils
*/

module.exports = {

  toSatoshi: function(btc) {
    return Number(btc) * 1e8;
  },

  toHours: function(ms) {
    return ms / (1000*60*60);
  }

};
