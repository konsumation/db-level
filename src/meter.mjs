import { Base } from "./base.mjs";

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
export class Meter extends Base {
  static get attributes() {
    return {
      ...super.attributes,
      serial: { type: "string" }
    };
  }
}
