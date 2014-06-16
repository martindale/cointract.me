var mongoose   = require('mongoose');
var mockgoose  = require('mockgoose');
var should     = require('should');
var proxyquire = require('proxyquire');
var sinon      = require('sinon');

mockgoose(mongoose);

describe('Invoice', function() {

  var Task = require('../../lib/models/task');

  var user1 = { _id: new mongoose.Types.ObjectId() };
  var user2 = { _id: new mongoose.Types.ObjectId() };

  var invoice = null;

  var address1 = 'n2UVQgrFqTRg633RT1HPidwj5LvoicSATd';
  var address2 = 'n327b2VvSJtoHc9yeY69NahmxVbqY5AHWS';

  var job1 = {
    _id: new mongoose.Types.ObjectId(),
    contractor: user1._id,
    pricingType: 'fixed',
    rate: 1.5e8,
    amountPaid: 0
  };

  var job2 = {
    _id: new mongoose.Types.ObjectId(),
    contractor: user2._id,
    pricingType: 'hourly',
    rate: 0.5e8,
    amountPaid: 0
  };

  var task1 = {
    _id: new mongoose.Types.ObjectId(),
    job: job1._id
  };

  var task2 = {
    _id: new mongoose.Types.ObjectId(),
    job: job1._id
  };

  var task3 = {
    _id: new mongoose.Types.ObjectId(),
    timecard: [{
      start: new Date('2014-06-01'),
      end: new Date('2014-06-02')
    }],
    job: job2._id
  };

  var task4 = {
    _id: new mongoose.Types.ObjectId(),
    timecard: [{
      start: new Date('2014-06-02'),
      end: new Date('2014-06-03')
    }],
    job: job2._id
  };

  var taskStub = {
    get: sinon.stub().returns(new Date('2014-06-03') - new Date('2014-06-02'))
  };

  var Invoice  = proxyquire('../../lib/models/invoice', {
    './task': {
      find: sinon.stub().callsArgWith(1, null, [taskStub, taskStub])
    }
  });

  var transaction = {
    txid: 'xxx',
    vout: [
      { value: '24.00000000', scriptPubKey: { addresses: [address2] } },
      { value: '1.500000000', scriptPubKey: { addresses: [address1] } }
    ]
  };

  describe('#create', function() {

    it('should fail with invalid price supplied', function(done) {
      Invoice.create(user1, job1, {
        price: 2e8,
        address: address2,
        tasks: [task1._id, task2._id]
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should create a fixed price invoice for the job', function(done) {
      Invoice.create(user1, job1, {
        price: 1.5e8,
        address: address1
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        result.price.should.equal(1.5e8);
        done();
      });
    });

    it('should fail with invalid address supplied', function(done) {
      Invoice.create(user2, job2, {
        price: 1e8,
        address: 'badaddress'
      }, function(err, result) {
        should.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should create an invoice for the job from tasks', function(done) {
      Invoice.create(user2, job2, {
        address: address2,
        tasks: [task3._id, task4._id]
      }, function(err, result) {
        should.not.exist(err);
        should.exist(result);
        should.exist(result.price);
        invoice = result;
        done();
      });
    });

  });

  describe('#reconcileTransaction', function() {

    it('mark the invoice as paid for the transaction', function(done) {
      Invoice.reconcileTransaction(transaction, function(err, reconciled) {
        should.not.exist(err);
        should.exist(reconciled);
        reconciled.should.instanceOf(Array).and.have.lengthOf(2);
        reconciled[0].status.should.equal('paid');
        reconciled[1].status.should.equal('paid');
        done();
      });
    });

  });

  describe('#getAddressQR', function() {

    it('should return a data uri string', function(done) {
      invoice.getAddressQR(done);
    });

  });

  describe('#notifyPayment', function() {

    it.skip('should send email notification to both parties', function(done) {

    });

  });

});
