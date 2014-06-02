/*
** cointract.me - emailer
*/

var config     = require('../config');
var log        = require('../log');
var fs         = require('fs');
var nodemailer = require('nodemailer');
var async      = require('async');
var handlebars = require('handlebars');

var Mailer = function() {
  this.transport = nodemailer.createTransport('SMTP', {
    host: config.smtp.host,
    secureConnection: true,
    port: config.smtp.port,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
  });
  this.templatePath = __dirname + '/templates/';
};

Mailer.prototype.send = function(template, options, callback) {
  var self = this;
  // generate email templates
  self.generateEmail(template, options.data, function(err, email) {
    if (err) return callback(err);
    // fire off the email
    self.transport.sendMail({
      to: options.to,
      from: 'Cointract.me <robot@cointract.me>',
      subject: email.subject,
      html: email.html,
      text: email.text || null,
      generateTextFromHTML: true
    }, function(err, responseStatus) {
      if (err) {
        log.err(err);
        return callback(err);
      }
      log.info('sent email "' + template + '" to ' + options.to);
      callback(null, responseStatus);
    });
  });
};

Mailer.prototype.generateEmail = function(template, data, callback) {
  var self  = this;
  var email = {};
  data.server = config.server;
  // load in the email template data
  async.series(
    [
      function getHTML(done) {
        self.loadTemplate(template + '.html', function(err, tmpl) {
          if (err) return done(err);
          email.html = tmpl ? handlebars.compile(tmpl)(data) : null;
          done();
        });
      },
      function getPlainText(done) {
        self.loadTemplate(template + '.txt', function(err, tmpl) {
          if (err) return done(err);
          email.text = tmpl ? handlebars.compile(tmpl)(data) : null;
          done();
        });
      },
      function getSubject(done) {
        self.loadTemplate(template + '.subject', function(err, subj) {
          if (err) return done(err);
          email.subject = subj || 'Cointract.me Alert'
          done();
        });
      }
    ],
    function(err, results) {
      if (err) {
        log.err(err);
        return callback(err);
      }
      callback(null, email);
    }
  );
};

Mailer.prototype.loadTemplate = function(template, callback) {
  var path = this.templatePath + template;
  fs.exists(path, function(exists) {
    if (!exists) return callback(null, null);
    fs.readFile(path, function(err, buf) {
      if (err) return callback(err);
      callback(null, buf.toString());
    });
  });
};

module.exports = new Mailer();
