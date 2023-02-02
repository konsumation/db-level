import { Readable } from "node:stream";
import { Base } from "./base.mjs";
import { Meter } from "./meter.mjs";
import { Note } from "./note.mjs";
import { secondsAsString, readStreamWithTimeOptions } from "./util.mjs";
import { CATEGORY_PREFIX, VALUE_PREFIX, METER_ATTRIBUTES } from "./consts.mjs";
import { description } from "./attributes.mjs";

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
export class Category extends Base {
  static get attributes() {
    return {
      description,
      ...METER_ATTRIBUTES
    };
  }

  static get keyPrefix() {
    return CATEGORY_PREFIX;
  }

  /**
   * Get categories.
   * @param {levelup} db
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterator<Category>}
   */
  static async *entries(db, gte, lte) {
    yield* super.entries(db, this.keyPrefix, gte, lte);
  }

  /**
   * Key for a given value.
   * @param {number} time seconds since epoch
   * @return {string} key
   */
  valueKey(time) {
    return VALUE_PREFIX + this.name + "." + secondsAsString(time);
  }

  /**
   * Write a time/value pair.
   * @param {levelup} db
   * @param {number} value
   * @param {number} time seconds since epoch
   */
  async writeValue(db, value, time) {
    return db.put(this.valueKey(time), value);
  }

  //TODO error handle if key doesn exists add some in catch block? now works...withouth catch abends
  //https://github.com/Level/levelup#get
  /**
   *
   * @param {levelup} db
   * @param {number} time seconds since epoch
   */
  async getValue(db, time) {
    return db.get(this.valueKey(time), { asBuffer: false }).catch(err => {});
  }

  /**
   *
   * @param {levelup} db
   * @param {number} time seconds since epoch
   */
  async deleteValue(db, time) {
    return db.del(this.valueKey(time));
  }

  /**
   * Get values of the category.
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
      readStreamWithTimeOptions(key, options)
    )) {
      const value = parseFloat(data.value.toString());
      const time = parseInt(data.key.toString().slice(prefixLength), 10);
      yield { value, time };
    }
  }

  /**
   * Get values of the category as ascii text stream with time and value on each line.
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte time of earliest value
   * @param {string} options.lte time of latest value
   * @param {boolean} options.reverse order
   * @return {Readable}
   */
  readStream(db, options) {
    const key = VALUE_PREFIX + this.name + ".";

    return new CategoryValueReadStream(
      db.iterator(readStreamWithTimeOptions(key, options)),
      key.length
    );
  }

  /**
   * Get Meters of the category.
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte from name
   * @param {string} options.lte up to name
   * @param {boolean} options.reverse order
   * @return {Iterator<Meter>}
   */
  async *meters(db, options) {
    yield* this.readDetails(Meter, db, options);
  }

  /**
   * Get Notes of the category.
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte time
   * @param {string} options.lte up to time
   * @param {boolean} options.reverse order
   * @return {Iterator<Meter>}
   */
  async *notes(db, options) {
    yield* this.readDetails(Note, db, options);
  }
}

class CategoryValueReadStream extends Readable {
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
