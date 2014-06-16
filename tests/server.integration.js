var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var config     = require('../lib/config');
var request    = require('request');

describe('Server', function() {

  var server = require('../lib/server');
  var url    = 'https://' + config.server.host + ':' + config.server.port;

  describe('#start', function() {

    it('should start the web server', function(done) {
      server.start(function(err) {
        should.not.exist(err);
        request(url, {
          rejectUnauthorized: false
        }, function(err) {
          should.not.exist(err);
          done();
        });
      });
    });

  });

});
