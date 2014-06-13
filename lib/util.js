/*
** cointract.me - utils
*/

module.exports = {

  toSatoshis: function(btc) {
    return Number(btc) * 1e8;
  },

  toHours: function(ms) {
    return ms / (1000*60*60);
  },

  days: function(days) {
    return (days || 1) * (1000 * 60 * 60 * 24);
  }

};
