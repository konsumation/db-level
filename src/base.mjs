import { readStreamOptions } from "./util.mjs";
import { definePropertiesFromOptions, optionJSON } from "./attribute.mjs";
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
   * @param {Base} object
   * @return {String} prefix for a given (master) object
   */
  static keyPrefixWith(object) {
    return this.keyPrefix + object.name + ".";
  }

  /**
   * Name of the type in text dump
   * @return {string}
   */
  static get typeName() {
    return this.name.toLowerCase();
  }

  /**
   * Additional attributes to be persisted
   */
  static get attributes() {
    return {
      /**
       * Description of the content.
       * @return {string}
       */
      description: { type: "string", writable: true }
    };
  }

  /**
   * Get instances without owner.
   * @param {levelup} db
   * @param {string} prefix
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
      yield new this(name, undefined, JSON.parse(data.value.toString()));
    }
  }

  /**
   * Get instances with owner.
   * @param {levelup} db
   * @param {Object} owner
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterator<Base>}
   */
  static async *entriesWith(db, object, gte = "\u0000", lte = "\uFFFF") {
    const prefix = this.keyPrefixWith(object);

    for await (const data of db.createReadStream({
      gte: prefix + gte,
      lte: prefix + lte
    })) {
      const name = data.key.toString().slice(prefix.length);

      yield new this(name, object, JSON.parse(data.value.toString()));
    }
  }

  /**
   * Get a single instance.
   * @param {levelup} db
   * @param {string} key
   * @return {Base}
   */
  static async entry(db, key) {
    for await (const c of this.entries(db, key)) {
      return c;
    }
  }

  constructor(name, owner, options) {
    definePropertiesFromOptions(this, options, {
      name: { value: name },
      owner: { value: owner }
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
   * @return {string}
   */
  get key() {
    return this.keyPrefix + this.name;
  }

  /**
   * Writes object into database.
   * Leaves all other entries alone.
   * @see {key}
   * @param {levelup} db
   */
  async write(db) {
    const values = {};

    for (const a in this.constructor.attributes) {
      if (this[a] !== undefined) {
        values[a] = this[a];
      }
    }

    return db.put(this.key, JSON.stringify(values));
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

  /**
   * Get detail objects.
   * @param {Class} factory
   * @param {levelup} db
   * @param {Object} options
   * @param {string} options.gte from name
   * @param {string} options.lte up to name
   * @param {boolean} options.reverse order
   * @return {Iterator<factory>}
   */
  async *readDetails(factory, db, options) {
    const key = factory.keyPrefixWith(this);

    for await (const data of db.createReadStream(
      readStreamOptions(key, options)
    )) {
      const name = data.key.toString().slice(key.length);
      yield new factory(name, this, JSON.parse(data.value.toString()));
    }
  }

  /**
   * Delete record from database.
   * @param {levelup} db
   */
  async delete(db) {
    return db.del(this.key);
  }
}
