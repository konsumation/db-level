import {
  description,
  serial,
  unit,
  fractionalDigits
} from "@konsumation/model";
import { Base } from "./base.mjs";
import { Category } from "./category.mjs";
import { METER_PREFIX } from "./consts.mjs";

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
      description,
      serial,
      unit,
      fractionalDigits
    };
  }

  static get typeName() {
    return "meter";
  }

  static get keyPrefix() {
    return METER_PREFIX;
  }
  
  static keyPrefixWith(object) {
    return this.keyPrefix + object.name + ".";
  }

  get category() {
    return this.owner;
  }

  get unit() {
    return this.category?.unit;
  }

  get fractionalDigits() {
    return this.category?.fractionalDigits;
  }

  get keyPrefix() {
    return METER_PREFIX + this.category.name + ".";
  }
}
