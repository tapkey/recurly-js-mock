# recurly-js-mock
[![Build Status](https://travis-ci.org/tapkey/recurly-js-mock.svg?branch=master)](https://travis-ci.org/tapkey/recurly-js-mock)

A tiny service returning [`Recurly.js`][recurlyjs] tokens for automated test scenarios

# What it does
This service returns [`Recurly.js`][recurlyjs] tokens for automated test scenarios
by running a headless browser in the background, entering user-provided data
into a minimal payment form and submitting the data to Recurly.

# How it works
## Single-run mode
1. Spin up a headless browser (phantomjs via the [phantom node interface](https://www.npmjs.com/package/phantom))
2. Load a HTML file containing a minimal payment form
3. Load and configure [`Recurly.js`][recurlyjs], this will inject the hosted credit card fields
4. Fill the form with either user-provided or default values
5. Submit the form and retrieve the [`Recurly.js`][recurlyjs] token
6. Shut down the headless browser and return the token

## Daemon mode
Not yet implemented.

# Using the CLI
If you installed this package via npm, this package's CLI can be accessed as follows:
```shell
$ recurly-js-mock --key <your-recurly-public-api-key>
```

```
$recurly-js-mock --help

Usage: recurlyJsMockCLI [options]


Options:

  -V, --version             output the version number
  -k, --key <value>         public key for Recurly.js
  -n, --number [value]      the credit card"s number
  -m, --month [value]       the credit card"s expiration month
  -y, --year [value]        the credit card"s expiration year
  -f, --firstName [value]   first name
  -l, --lastName [value]    first name
  -q, --cvv [value]         the credit card"s CVV
  -a, --address1 [value]    address field 1
  -b, --address2 [value]    address field 2
  -c, --city [value]        city
  -o, --country [value]     country, e.g. "US"
  -p, --postalCode [value]  postal code
  -t, --phone [value]       phone number
  -s, --state [value]       state
  -x, --vatNumber [value]   VAT number
  -y, --logLevel [level]    log level [error]
  -h, --help                output usage information
```
On success, the CLI will return the [`Recurly.js`][recurlyjs] token.

# Using as library
This application is written in TypeScript. To consume its functionality in another
project, import the library
```typescript
import { RecurlyJsMock } from "./recurlyJsMock";
```
and generate a [`Recurly.js`][recurlyjs] token
```typescript
RecurlyJsMock.getTokenSingleRun("<your-recurly-public-api-key>")
  .then((token) => console.log(token.id));
```
which can be used in automated test scenarios.

# Building locally
To build from source locally, clone this repository and run
```shell
$ npm install
$ npm run build
```

# License
Copyright (c) Tapkey GmbH. All rights reserved.

Licensed under the [Apache License 2.0](https://spdx.org/licenses/Apache-2.0.html)

[recurlyjs]: https://recurly.com/recurlyjs/  "Recurly.js"
