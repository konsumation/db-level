import { Base } from "./base.mjs";
import { METER_ATTRIBUTES } from "./consts.mjs";

/**
 * Meter
 * @param {string} name meter name
 * @param {Category} category
 * @param {Object} options
 * @param {string} options.description
 * @param {string} options.unit physical unit like kWh or m3
 * @param {number} options.fractionalDigits display precission
 *
 * @property {string} name category name
 * @property {string} description
 * @property {string} unit physical unit
 * @property {number} fractionalDigits display precission
 */
export class Meter extends Base {
  static get attributes() {
    return {
      ...super.attributes,
      ...METER_ATTRIBUTES,
      serial: { type: "string", writable: true }
    };
  }

  get category() {
    return this.owner;
  }

  get unit() {
    if(this.category) {
      return this.category.unit;
    }
  }

  get fractionalDigits() {
    if(this.category) {
      return this.category.fractionalDigits;
    }
  }

  get keyPrefix() {
    return super.keyPrefix + this.category.name + ".";
  }
}
