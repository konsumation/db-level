import { definePropertiesFromOptions, optionJSON } from "./util.mjs";
import { SCHEMA_VERSION_1 } from "./consts.mjs";

/**
 * Base
 * @param {string} name meter name
 * @param {Object} options
 * @param {string} options.description
 * @param {string} options.unit physical unit like kWh or m3
 *
 * @property {string} name category name
 * @property {string} description
 * @property {string} unit physical unit
 */
export class Base {
  /**
   * Prefix of the key
   * @return {string}
   */
  static get keyPrefix() {
    return this.typeName + "s.";
  }

  /**
   * Name of the type in text dump
   * @return {string}
   */
  static get typeName() {
    return this.name.toLowerCase();
  }

  static get attributes() {
    return {
      /**
       * the description of the content.
       * @return {string}
       */
      description: { type: "string" },

      /**
       * physical unit.
       * @return {string}
       */
      unit: { type: "string" },

      fractionalDigits: { type: "number", default: 2 }
    };
  }

  /**
   * Get instances
   * @param {levelup} db
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterator<Base>}
   */
  static async *entries(db, prefix, gte = "\u0000", lte = "\uFFFF") {
    for await (const data of db.createReadStream({
      gte: prefix + gte,
      lte: prefix + lte
    })) {
      const name = data.key.toString().slice(prefix.length);
      yield new this(name, JSON.parse(data.value.toString()));
    }
  }

  /**
   * Get a single instance
   * @param {levelup} db
   * @param {string} name
   * @return {Base}
   */
  static async entry(db, name) {
    for await (const c of this.entries(db, name)) {
      return c;
    }
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

  get typeName() {
    return this.constructor.typeName;
  }

  get keyPrefix() {
    return this.constructor.keyPrefix;
  }

  /**
   * @param {levelup} db
   */
  async write(db, key) {
    const values = {};

    for (const a in this.constructor.attributes) {
      if (this[a] !== undefined) {
        values[a] = this[a];
      }
    }

    return db.put(key, JSON.stringify(values));
  }

  async writeAsText(out, name, master) {
    await out.write(
      master.schemaVersion === SCHEMA_VERSION_1
        ? `[${name}]\n`
        : `[${this.typeName} "${name}"]\n`
    );

    for (const o of Object.keys(this.constructor.attributes)) {
      const v = this[o];
      if (v !== undefined) {
        await out.write(`${o}=${v}\n`);
      }
    }
    return out.write("\n");
  }
}
