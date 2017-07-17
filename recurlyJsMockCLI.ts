#!/usr/bin/env node

import * as program from "commander";
import { LogLevel, PaymentDetails, RecurlyJsMock, RecurlyToken } from "./recurlyJsMock";

// CLI arguments
program
  // tslint:disable:no-var-requires
  .version(require("../package.json").version)
  .option("-k, --key <value>", "public key for Recurly.js")
  .option("-n, --number [value]", "the credit card's number", "4111 1111 1111 1111")
  .option("-m, --month [value]", "the credit card's expiration month", "10")
  .option("-y, --year [value]", "the credit card's expiration year", "20")
  .option("-f, --firstName [value]", "first name", "John")
  .option("-l, --lastName [value]", "first name", "Doe")
  .option("-q, --cvv [value]", "the credit card's CVV")
  .option("-a, --address1 [value]", "address field 1")
  .option("-b, --address2 [value]", "address field 2")
  .option("-c, --city [value]", "city")
  .option("-o, --country [value]", "country, e.g. \"US\"")
  .option("-p, --postalCode [value]", "postal code")
  .option("-t, --phone [value]", "phone number")
  .option("-s, --state [value]", "state")
  .option("-x, --vatNumber [value]", "VAT number")
  .option("-r, --apiOnly", "use API only rather than headless browser")
  .option("-y, --logLevel [level]", "log level [error]", /^(debug|info|warn|error)$/i, "error")
  .parse(process.argv);

if (!program.key) {
  program.help();
}

(async () => {
  let token;
  if (program.apiOnly) {
    token = await RecurlyJsMock.getTokenAPICall(
      program.key,
      getLogLevelConfiguration(),
      getPaymentDetails()
    );
  } else {
    token = await RecurlyJsMock.getTokenSingleRun(
      program.key,
      getLogLevelConfiguration(),
      getPaymentDetails()
    );
  }
  // tslint:disable:no-console
  console.log(token.id);

// tslint:disable:no-console
})().catch((err) => {
  console.log(err);
  process.exit(2);
});

function getLogLevelConfiguration(): LogLevel {
  switch (program.logLevel) {
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

function getPaymentDetails(): PaymentDetails {
  const details: PaymentDetails = { cardData: {} };
  details.cardData.number = program.number ? program.number : undefined;
  details.cardData.cvv = program.cvv ? program.cvv : undefined;
  details.cardData.month = program.month ? program.month : undefined;
  details.cardData.year = program.year ? program.year : undefined;
  details.cardData.firstName = program.firstName ? program.firstName : undefined;
  details.cardData.lastName = program.lastName ? program.lastName : undefined;
  details.address1 = program.addressOne ? program.addressOne : undefined;
  details.address2 = program.addressTwo ? program.addressTwo : undefined;
  details.city = program.city ? program.city : undefined;
  details.country = program.country ? program.country : undefined;
  details.phone = program.phone ? program.phone : undefined;
  details.postalCode = program.postalCode ? program.postalCode : undefined;
  details.state = program.state ? program.state : undefined;
  details.vatNumber = program.vatNumber ? program.vatNumber : undefined;
  return details;
}
