import { Readable } from "stream";
import { secondsAsString, definePropertiesFromOptions, optionJSON } from "./util.mjs";

/**
 * prefix of the categories
 * will be followed by the category name
 */
const CATEGORY_PREFIX = "categories.";

/**
 * prefix of the values
 * will be followed by the category name
 */
const VALUE_PREFIX = "values.";

const METER_PREFIX = "meters.";

/**
 * Value Catetegory
 * @param {string} name category name
 * @param {Object} options
 * @param {string} options.description
 * @param {string} options.unit physical unit like kWh or m3
 *
 * @property {string} name category name
 * @property {string} description
 * @property {string} unit physical unit
 */
export class Category {

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

  constructor(name, options) {
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

  /**
   * write the category. Leaves all the values alone
   * @param {levelup} db
   */
  async write(db) {
    const key = CATEGORY_PREFIX + this.name;
    return db.put(key, JSON.stringify({ unit: this.unit, description: this.description }));
  }

  /**
   * get categories
   * @param {levelup} db
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterator<Category>}
   */
  static async *entries(db, gte = "\u0000", lte = "\uFFFF") {
    for await (const data of db.createReadStream({
      gte: CATEGORY_PREFIX + gte,
      lte: CATEGORY_PREFIX + lte
    })) {
      const name = data.key.toString().slice(CATEGORY_PREFIX.length);
      yield new Category(name, JSON.parse(data.value.toString()));
    }
  }

  /**
   * get a single category
   * @param {levelup} db
   * @param {string} name
   * @return {Category}
   */
  static async entry(db, name) {
    for await (const c of this.entries(db, name)) {
      return c;
    }
  }

  /**
   * write a time/value pair
   * @param {levelup} db
   * @param {number} value
   * @param {number} time seconds since epoch
   */
  async writeValue(db, value, time) {
    const key = VALUE_PREFIX + this.name + "." + secondsAsString(time);
    return db.put(key, value);
  }

  /**
   * get values of the category
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
   * get values of the category as ascii text stream with time and value on each line
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte time of earliest value
   * @param {string} options.lte time of latest value
   * @param {boolean} options.reverse order
   * @return {Readable}
   */
  readStream(db, options) {
    const key = VALUE_PREFIX + this.name + ".";
    const prefixLength = key.length;

    return new CategoryReadStream(
      db.iterator(readStreamOptions(key, options)),
      prefixLength
    );
  }
  
  async *meters(db,options)
  {
   const key = METER_PREFIX + this.name + ".";
    const prefixLength = key.length;
    for await (const data of db.createReadStream(
      readStreamOptions(key, options)
    )) {
      yield new Meter();
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
        this.push(`${parseInt(key.toString().slice(this.prefixLength), 10)} ${parseFloat(value.toString())}\n`);
      }
    });
  }
}
