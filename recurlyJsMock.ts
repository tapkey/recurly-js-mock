import * as merge from "deepmerge";
import fileUrl = require("file-url");
import * as path from "path";
import * as phantom from "phantom";
import * as request from "request";

declare var window: any;
declare var recurly: any;
declare var $: any;

/**
 * Can be used to mock Recurly.js functionality during automated testing.
 */
export class RecurlyJsMock {

  /**
   * Spins up a headless browser instance, creates a Recurly.js compliant form,
   * inputs the desired data and returns the Recurly.js token.
   *
   * @param publicApiKey The public API key of the Recurly account to be used
   * @param logLevel The desired log level. Can be debug, info, warn or error.
   * @param details The payment information to be used to fill out the form
   */
  public static getTokenSingleRun(
    publicApiKey: string,
    logLevel: LogLevel = LogLevel.Error,
    details?: PaymentDetails): Promise<RecurlyToken> {

    return new Promise<RecurlyToken>(async (resolve, reject) => {

      /*
       * The PhantomJs instance has to be run with web security turned off in order
       * to allow accessing iframe contents.
       */
      const instance = await phantom.create(
        ["--web-security=no"],
        { logLevel: RecurlyJsMock.getLogLevelConfiguration(logLevel) }
      );
      const page = await instance.createPage();

      /*
       * Listen for callbacks from client JS. This is used to detect when Recurly.js
       * has finished processing payment information and the token is ready to
       * be collected.
       */
      await page.on("onCallback", async (data: Callback) => {
        switch (data.status) {
          case "success":
            resolve(data.token);
            await instance.exit();
            break;
          case "error":
            reject(data.err);
            await instance.exit(1);
            break;
          default:
            reject();
            await instance.exit(2);
            break;
        }
      });

      /*
       * Listen to resource requested events for debugging purposes.
       */
      await page.on("onResourceRequested", (requestData) => {
        instance.logger.debug("Requesting", requestData.url);
      });

      /*
       * Load the html form.
       */
      const status = await page.open(fileUrl(path.resolve(__dirname, "recurlyJsMock.html")));
      instance.logger.debug(status);

      /*
       * Load required JS libraries.
       */
      await page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js");
      await page.includeJs("https://js.recurly.com/v4/recurly.js");

      /*
       * Configure Recurly.js
       */
      await page.evaluate((key) => {
        recurly.configure({
          publicKey: key
        });
      }, publicApiKey);

      const content = await page.property("content");
      instance.logger.debug(content);

      // Listen for Recurly.js
      await page.evaluate(() => {

        // On form submit, we stop submission to get the token
        $("form").on("submit", function(event) {
          // Prevent the form from submitting while we retrieve the token from Recurly
          event.preventDefault();

          const form = this;
          // Now we call recurly.token with the form. It goes to Recurly servers
          // to tokenize the credit card information, then injects the token into the
          // data-recurly="token" field above
          recurly.token(form, (err, token) => {
            let result: Callback;
            if (err) {
                result = { status: "error", err };
            } else {
                result = { status: "success", token };
            }
            window.callPhantom(result);
          });
        });
      });

      /*
       * Fill out form and submit
       */
      await page.evaluate((paymentDetails: PaymentDetails) => {
        $("#number iframe").first().contents().find("input").first().val(paymentDetails.cardData.number);
        $("#month iframe").first().contents().find("input").first().val(paymentDetails.cardData.month);
        $("#year iframe").first().contents().find("input").first().val(paymentDetails.cardData.year);
        $("#first_name").val(paymentDetails.cardData.firstName);
        $("#last_name").val(paymentDetails.cardData.lastName);
        $("#address1").val(paymentDetails.address1);
        $("#city").val(paymentDetails.city);
        $("#country").val(paymentDetails.country);
        $("#postal_code").val(paymentDetails.postalCode);
        $("form").submit();
      }, RecurlyJsMock.mergeWithDefaults(details));

    });

  }

  /**
   * Returns the Recurly.js token without running a headless browser.
   *
   * @param publicApiKey The public API key of the Recurly account to be used
   * @param logLevel The desired log level. Can be debug, info, warn or error.
   * @param details The payment information to be used
   */
  public static getTokenAPICall(
    publicApiKey: string,
    logLevel: LogLevel = LogLevel.Error,
    details?: PaymentDetails): Promise<RecurlyToken> {

    return new Promise<RecurlyToken>((resolve, reject) => {
      const url = "https://api.recurly.com/js/v1/token";
      const data = RecurlyJsMock.mergeWithDefaults(details);
      const formData = {
        address1: data.address1 ? data.address1 : "",
        address2: data.address2 ? data.address2 : "",
        city: data.city ? data.city : "",
        country: data.country ? data.country : "",
        cvv: data.cardData.cvv ? data.cardData.cvv : "",
        first_name: data.cardData.firstName ? data.cardData.firstName : "",
        key: publicApiKey,
        last_name: data.cardData.lastName ? data.cardData.lastName : "",
        month: data.cardData.month ? data.cardData.month : "",
        number: data.cardData.number ? data.cardData.number : "",
        phone: data.phone ? data.phone : "",
        postal_code: data.postalCode ? data.postalCode : "",
        state: data.state ? data.state : "",
        vat_number: data.vatNumber ? data.vatNumber : "",
        year: data.cardData.year ? data.cardData.year : ""
      };
      request.post({ url, formData }, (err, res, body) => {
        if (err || res.statusCode !== 200) {
          reject(err);
        } else {
          body = JSON.parse(body);
          // Recurly API fails to respond with proper error code
          if (body.hasOwnProperty("error")) {
            reject(body.error);
          } else {
            resolve(body);
          }
        }
      });
    });
  }

  private static getLogLevelConfiguration(logLevel: LogLevel): string {
    switch (logLevel) {
      case LogLevel.Debug:
        return "debug";
      case LogLevel.Info:
        return "info";
      case LogLevel.Warn:
        return "warn";
      case LogLevel.Error:
        return "error";
      default:
        return "error";
    }
  }

  private static mergeWithDefaults(details: PaymentDetails): PaymentDetails {
    const defaults: PaymentDetails = {
      address1: "Street 1",
      cardData: {
        cvv: 123,
        firstName: "John",
        lastName: "Doe",
        month: 10,
        number: "4111 1111 1111 1111",
        year: 20
      },
      city: "Vienna",
      country: "AT",
      postalCode: "1080"
    };
    RecurlyJsMock.deleteUndefinedProperties(details);
    if (!details) {
      return defaults;
    } else {
      return merge(defaults, details);
    }
  }

  /**
   * Deletes undefined values from given details recursively including nested objects.
   */
  private static deleteUndefinedProperties(obj: any) {
    Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === "object") {
        RecurlyJsMock.deleteUndefinedProperties(obj[key]);
      } else if (obj[key] == null) {
        delete obj[key];
      }
    });
    return obj;
  }

  public startDaemon(publicApiKey: string, logLevel: LogLevel = LogLevel.Error): Promise<boolean> {
    throw new Error("Not implemented.");
  }

  public stopDaemon(): Promise<boolean> {
    throw new Error("Not implemented.");
  }

  public getToken(details: PaymentDetails): Promise<boolean> {
    throw new Error("Not implemented.");
  }

}

interface Callback {
  status: string;
  err?: any;
  token?: {
    id: string;
  };
}

export interface RecurlyToken {
  id: string;
}

interface RecurlyError {
  name: string;
  code: string;
  message: string;
  fields?: string[];
}

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

/**
 * Payment data handled by Recurly.js.
 *
 * @see https://dev.recurly.com/docs/getting-started-1#section-card-data
 * @see https://dev.recurly.com/docs/getting-started-1#section-billing-address
 */
export interface PaymentDetails {
  address1?: string;
  address2?: string;
  cardData?: {
    cvv?: number;
    firstName?: string;
    lastName?: string;
    month?: number;
    number?: string;
    year?: number;
  };
  city?: string;
  country?: string;
  phone?: string;
  postalCode?: string; // ISO 3166-1 alpha-2 country code
  state?: string;
  vatNumber?: string;
}
