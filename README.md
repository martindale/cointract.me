Cointract.me
============

*Do work. Track time. Get coins.*

Cointract.me is a collaborative task tracking app that allows you to post jobs,
get hired, track time, and accept bitcoin! Invoices are reconciled using the
[Insight API](http://insight.is) and payouts may be facilitated using the 
[BitPay API](https://bitpay.com/api).

## Quick Setup

Clone the repository and install dependencies with NPM.

```
~# git clone https://github.com/gordonwritescode/cointract.me.git
~# cd cointract.me
~# [sudo] npm install
```

Create a `config.json` in the app's root directory, following the conventions
in `config.example.json`.

```
~# cp config.example.json config.json
```

Run tests and fire up the server.

```
~# npm test
~# NODE_ENV=development npm start
```

## Creating Certificates

You will need to generate a self-signed SSL certificate to run the application,
for testing and development purposes.
You can do this easily by following
**[this guide](http://www.akadia.com/services/ssh_test_certificate.html)**.
