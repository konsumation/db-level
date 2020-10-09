import { Base } from "./base.mjs";
import { METER_PREFIX } from "./consts.mjs";

/**
 * Meter
 * @param {string} name meter name
 * @param {Category} category
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

  static async *entries(db, gte, lte) {
    yield * super.entries(db, METER_PREFIX, gte, lte);
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
    return this.constructor.keyPrefix + this.category.name + '.';
  }

  /**
   * Write the Meter.
   * @param {levelup} db
   */
  async write(db) {
    return super.write(db, this.keyPrefix + this.name);
  }
}
