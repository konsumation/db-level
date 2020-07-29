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
  static get attributes() {
    return {
      /**
       * the description of the content.
       * @return {string}
       */
      description: { type: "string" },

      /**
       * physical unit.
       * @return {string}
       */
      unit: { type: "string" },

      fractionalDigits: { type: "number", default: 2 }
    };
  }

  constructor( name, options) {
    definePropertiesFromOptions(this, options, {
      name: { value: name }
    });
  }
  
  toString() {
    return `${this.name}: ${this.unit}`;
  }
  
  toJSON() {
    return optionJSON(this, {
      name: this.name
    });
  }
}
