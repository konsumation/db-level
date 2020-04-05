import { Readable } from "stream";
import { secondsAsString, definePropertiesFromOptions, optionJSON } from "./util.mjs";

/**
 * Meter
 * @param {string} name meter name
 * @param {Object} options
 * @param {string} options.description
 * @param {string} options.unit physical unit like kWh or m3
 *
 * @property {string} name category name
 * @property {string} description
 * @property {string} unit physical unit
 */
export class Meter {
  static get defaultOptions() {
    return {
      /**
       * the description of the content.
       * @return {string}
       */
      description: undefined,

      /**
       * physical unit.
       * @return {string}
       */
      unit: undefined
    };
  }

  constructor(category, name) {
    definePropertiesFromOptions(this, options, {
      name: { value: name }
    });
  }
}
