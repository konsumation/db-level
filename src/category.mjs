import { ClassicLevel } from "classic-level";
import { Category, Meter } from "@konsumation/model";
import { CATEGORY_PREFIX } from "./consts.mjs";
import { LevelMeter } from "./meter.mjs";
import { readStreamOptions } from "./util.mjs";

/**
 * Value Category.
 * @param {string} name category name
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
export class LevelCategory extends Category {
  static get factories() {
    return {
      [LevelMeter.type]: LevelMeter
    };
  }

  static get keyPrefix() {
    return CATEGORY_PREFIX;
  }

  /**
   * Get categories.
   * @param {ClassicLevel} db
   * @param {string|undefined} gte lowest name
   * @param {string|undefined} lte highst name
   * @return {AsyncIterable<Category>}
   */
  static async *entries(db, gte = "\u0000", lte = "\uFFFF") {
    for await (const [key, value] of db.iterator({
      gte: CATEGORY_PREFIX + gte,
      lte: CATEGORY_PREFIX + lte
    })) {
      const values = JSON.parse(value);
      values.name = key.slice(CATEGORY_PREFIX.length);
      yield new this(values);
    }
  }

  /**
   * Writes object into database.
   * Leaves all other entries alone.
   * @see {key}
   * @param {ClassicLevel} db
   */
  async write(db) {
    return db.put(this.key, JSON.stringify(this.toJSON()));
  }

  get keyPrefix() {
    return CATEGORY_PREFIX;
  }

  /**
   * @return {string}
   */
  get key() {
    return CATEGORY_PREFIX + this.name;
  }

  /**
   * Get Meters of the category.
   * @param {ClassicLevel} db
   * @param {Object} [options]
   * @param {string} [options.gte] from name
   * @param {string} [options.lte] up to name
   * @param {boolean} [options.reverse] order
   * @return {AsyncIterable<Meter>}
   */
  async *meters(db, options) {
    // @ts-ignore
    const key = LevelMeter.keyPrefixWith(this);

    for await (const [k, value] of db.iterator(
      readStreamOptions(key, options)
    )) {
      const values = JSON.parse(value);
      values.name = k.slice(key.length);
      values.category = this;
      yield new LevelMeter(values);
    }
  }
}
