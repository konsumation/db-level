import { Readable } from "stream";
import { Meter } from "./meter.mjs";
import { Base } from "./base.mjs";
import { secondsAsString } from "./util.mjs";
import { CATEGORY_PREFIX, VALUE_PREFIX, METER_PREFIX } from "./consts.mjs";

/**
 * Value Category
 * @param {string} name category name
 * @param {Object} options
 * @param {string} options.description
 * @param {string} options.unit physical unit like kWh or m3
 *
 * @property {string} name category name
 * @property {string} description
 * @property {string} unit physical unit
 */
export class Category extends Base {
  static get keyPrefix() {
    return CATEGORY_PREFIX;
  }
 
  /**
   * Write the category. Leaves all the values alone
   * @param {levelup} db
   */
  async write(db) {
    return super.write(db, this.keyPrefix + this.name);
  }

  /**
   * Get categories
   * @param {levelup} db
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterator<Category>}
   */
  static async *entries(db, gte = "\u0000", lte = "\uFFFF") {
    yield* super.entries(db, CATEGORY_PREFIX, gte, lte);
  }

  /**
   * Write a time/value pair
   * @param {levelup} db
   * @param {number} value
   * @param {number} time seconds since epoch
   */
  async writeValue(db, value, time) {
    const key = VALUE_PREFIX + this.name + "." + secondsAsString(time);
    return db.put(key, value);
  }

  /**
   * Get values of the category
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte time of earliest value
   * @param {string} options.lte time of latest value
   * @param {boolean} options.reverse order
   * @return {Iterator<Object>}
   */
  async *values(db, options) {
    const key = VALUE_PREFIX + this.name + ".";
    const prefixLength = key.length;

    for await (const data of db.createReadStream(
      readStreamOptions(key, options)
    )) {
      const value = parseFloat(data.value.toString());
      const time = parseInt(data.key.toString().slice(prefixLength), 10);
      yield { value, time };
    }
  }

  /**
   * Get values of the category as ascii text stream with time and value on each line
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte time of earliest value
   * @param {string} options.lte time of latest value
   * @param {boolean} options.reverse order
   * @return {Readable}
   */
  readStream(db, options) {
    const key = VALUE_PREFIX + this.name + ".";

    return new CategoryReadStream(
      db.iterator(readStreamOptions(key, options)),
      key.length
    );
  }

  /**
   * Get meters of the category
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte time of earliest value
   * @param {string} options.lte time of latest value
   * @param {boolean} options.reverse order
   * @return {Iterator<Object>}
   */
  async *meters(db, options) {
    const key = METER_PREFIX + this.name + ".";
    for await (const data of db.createReadStream(
      readStreamOptions(key, options)
    )) {
      const name = data.key.toString().slice(key.length);
      yield new Meter(name, this, JSON.parse(data.value.toString()));
    }
  }
}

function readStreamOptions(key, options = {}) {
  return {
    ...options,
    gte: key + secondsAsString(options.gte || 0),
    lte: key + secondsAsString(options.lte || 999999999999999)
  };
}

class CategoryReadStream extends Readable {
  constructor(iterator, prefixLength) {
    super();
    Object.defineProperties(this, {
      iterator: { value: iterator },
      prefixLength: { value: prefixLength }
    });
  }
  _read() {
    if (this.destroyed) return;

    this.iterator.next((err, key, value) => {
      if (this.destroyed) return;
      if (err) {
        return this.iterator.end(err2 => callback(err || err2));
      }

      if (key === undefined && value === undefined) {
        this.push(null);
      } else {
        this.push(
          `${parseInt(
            key.toString().slice(this.prefixLength),
            10
          )} ${parseFloat(value.toString())}\n`
        );
      }
    });
  }
}
