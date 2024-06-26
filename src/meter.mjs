import { Category, Meter, Value } from "@konsumation/model";
import {
  readStreamWithTimeOptions,
  readStreamOptions
} from "./util.mjs";
import { METER_PREFIX } from "./consts.mjs";
import { LevelNote } from "./note.mjs";
import { LevelValue } from "./value.mjs";

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
      [LevelNote.type]: LevelNote,
      [LevelValue.type]: LevelValue
    };
  }

  static get keyPrefix() {
    return METER_PREFIX;
  }

  static async *entriesWith(db, object, gte = "\u0000", lte = "\uFFFF") {
    // @ts-ignore
    const prefix = this.keyPrefixWith(object);

    for await (const [key, value] of db.iterator({
      gte: prefix + gte,
      lte: prefix + lte
    })) {
      const values = JSON.parse(value);
      values.name = key.slice(prefix.length);
      values[object.type] = object;
      yield new this(values);
    }
  }

  async write(db) {
    return db.put(this.key, JSON.stringify(this.toJSON()));
  }

  /**
   * List assigned Notes.
   * @param {any} db
   * @param {Object} [options]
   * @return {AsyncIterable<LevelNote>}
   */
  async *notes(db, options) {
    // @ts-ignore
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
   * Get values of the meter.
   * @param {any} db
   * @param {Object} [options]
   * @param {string} [options.gte] time of earliest value
   * @param {string} [options.lte] time of latest value
   * @param {boolean} [options.reverse] order
   * @return {AsyncIterable<Value>}
   */
  async *values(db, options) {
    const key = LevelValue.keyPrefixWith(this);
    const prefixLength = key.length;

    for await (const [k, v] of db.iterator(
      readStreamWithTimeOptions(key, options)
    )) {
      yield new LevelValue({
        meter: this,
        value: parseFloat(v),
        date: new Date(parseInt(k.slice(prefixLength), 10) * 1000)
      });
    }
  }

  /**
   * @return {string}
   */
  get key() {
    return METER_PREFIX + this.category.name + "." + this.name;
  }
}
