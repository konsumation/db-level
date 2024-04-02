import { Category, Meter } from "@konsumation/model";
import { secondsAsString, readStreamWithTimeOptions, readStreamOptions } from "./util.mjs";
import { VALUE_PREFIX, METER_PREFIX } from "./consts.mjs";
import { LevelNote } from "./note.mjs";

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
export class LevelMeter extends Meter {
  static get factories() {
    return {
      [LevelNote.typeName]: LevelNote
    };
  }

  static get keyPrefix() {
    return METER_PREFIX;
  }

  static async *entriesWith(db, object, gte = "\u0000", lte = "\uFFFF") {
    const prefix = this.keyPrefixWith(object);

    for await (const [key, value] of db.iterator({
      gte: prefix + gte,
      lte: prefix + lte
    })) {
      const values = JSON.parse(value);
      values.name = key.slice(prefix.length);
      values[object.typeName] = object;
      yield new this(values);
    }
  }

  async write(db) {
    return db.put(this.key, JSON.stringify(this.attributeValues));
  }

  async *notes(db, options) {
    const key = LevelNote.keyPrefixWith(this);

    for await (const [k, value] of db.iterator(
      readStreamOptions(key, options)
    )) {
      const values = JSON.parse(value);
      values.name = k.slice(key.length);
      yield new LevelNote(values);
    }
  }

  /**
   * Key for a given value.
   * @param {Date} time seconds since epoch
   * @return {string} key
   */
  valueKey(time) {
    return VALUE_PREFIX + this.name + "." + secondsAsString(time.getTime());
  }

  /**
   * Write a time/value pair.
   * @param {ClassicLevel} db
   * @param {Date} time seconds since epoch
   * @param {number} value
   */
  async writeValue(db, time, value) {
    return db.put(this.valueKey(time), value);
  }

  /**
   *
   * @param {ClassicLevel} db
   * @param {number} time seconds since epoch
   */
  async getValue(db, time) {
    return db
      .get(this.valueKey(time) /* { asBuffer: false }*/)
      .catch(err => {});
  }

  /**
   *
   * @param {ClassicLevel} db
   * @param {number} time seconds since epoch
   */
  async deleteValue(db, time) {
    return db.del(this.valueKey(time));
  }

  /**
   * Get values of the category.
   * @param {ClassicLevel} db
   * @param {Object} options
   * @param {string} options.gte time of earliest value
   * @param {string} options.lte time of latest value
   * @param {boolean} options.reverse order
   * @return {AsyncIterable<{value:number, time: number}>}
   */
  async *values(db, options) {
    const key = VALUE_PREFIX + this.name + ".";
    const prefixLength = key.length;

    for await (const [k, v] of db.iterator(
      readStreamWithTimeOptions(key, options)
    )) {
      yield { value: parseFloat(v), time: parseInt(k.slice(prefixLength), 10) };
    }
  }

  get keyPrefix() {
    return METER_PREFIX + this.category.name + ".";
  }

  /**
   * @return {string}
   */
  get key() {
    return METER_PREFIX + this.category.name + "." + this.name;
  }
}
