#!/usr/bin/env node

import * as program from "commander";
import { LogLevel, RecurlyJsMock } from "./recurlyJsMock";

// CLI arguments
program
  // tslint:disable:no-var-requires
  .version(require("../package.json").version)
  .option("-k, --key <value>", "public key for Recurly.js")
  .option("-n, --number [value]", "the credit card\"s number", "4111 1111 1111 1111")
  .option("-m, --month [value]", "the credit card\"s expiration month", "10")
  .option("-y, --year [value]", "the credit card\"s expiration year", "20")
  .option("-f, --firstName [value]", "first name", "John")
  .option("-l, --lastName [value]", "first name", "Doe")
  .option("-q, --cvv [value]", "the credit card\"s CVV")
  .option("-a, --address1 [value]", "address field 1")
  .option("-b, --address2 [value]", "address field 2")
  .option("-c, --city [value]", "city")
  .option("-o, --country [value]", "country, e.g. \"US\"")
  .option("-p, --postalCode [value]", "postal code")
  .option("-t, --phone [value]", "phone number")
  .option("-s, --state [value]", "state")
  .option("-x, --vatNumber [value]", "VAT number")
  .option("-y, --logLevel [level]", "log level [error]", /^(debug|info|warn|error)$/i, "error")
  .parse(process.argv);

if (!program.key) {
  program.help();
}

(async () => {
  const token = await RecurlyJsMock.getTokenSingleRun(
    program.key,
    getLogLevelConfiguration(program.logLevel)
  );
  // tslint:disable:no-console
  console.log(token.id);
})();

function getLogLevelConfiguration(logLevel: string): LogLevel {
  switch (logLevel) {
    case "debug":
      return LogLevel.Debug;
    case "info":
      return LogLevel.Info;
    case "warn":
      return LogLevel.Warn;
    case "error":
      return LogLevel.Error;
    default:
      return LogLevel.Error;
  }
}
