import { Base } from "./base.mjs";
import { METER_PREFIX, METER_ATTRIBUTES } from "./consts.mjs";

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
      serial: { type: "string" }
    };
  }

  static get keyPrefix() {
    return METER_PREFIX;
  }

  static async *entries(db, gte, lte) {
    yield* super.entries(db, this.keyPrefix, gte, lte);
  }

  constructor(name, category, options) {
    super(name, options);
    Object.defineProperties(this, { category: { value: category } });
  }

  get unit() {
    return this.category.unit;
  }

  get fractionalDigits() {
    return this.category.fractionalDigits;
  }

  get keyPrefix() {
    return this.constructor.keyPrefix + this.category.name + ".";
  }
}
