Cointract.me
============

*Do work. Track time. Get coins.*

[![Build Status](https://travis-ci.org/gordonwritescode/cointract.me.svg?branch=master)](https://travis-ci.org/gordonwritescode/cointract.me)

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

## BitPay Integration

We use the [node-bitpay-client](https://github.com/gordonwritescode/node-bitpay-client)
library for accepting payments for job postings. If you wish to charge your
users for posting jobs, set the `payments.price` and `payments.currency` in your
*config.json*. If the `payments.price` is set to `0`, then the job will be
be published automatically after a brief moment.

Consult the node-bitpay-client documentation for details on setting up your
client access keys for your BitPay account. The quick and dirty way:

```
~# cd node_modules/bitpay && sudo npm link
~# bitpay keygen
~# bitpay login -e you@domain.com
```

Then check your email and approve the access key request or use the key manager
interface from within the BitPay website's dashboard to approve the key. Once
approved, you can run the following to verify things are working:

```
~# bitpay whoami
```

Then update your *config.json* and set `bitpay.pubkey` and `bitpay.secret` to
the **absolute** path to your keys. By default, this is `$HOME/.bitpay/api.key`
and `$HOME/.bitpay/api.pub`, but may differ if you set an explicit path using
the `-o` or `--output` option when generating the keys.

## Creating Certificates

You should generate a self-signed SSL certificate to run the application with
your config's `server.ssl.enabled` set to `true`, for testing and development
purposes.

You can do this easily by following
**[this guide](http://www.akadia.com/services/ssh_test_certificate.html)**.
