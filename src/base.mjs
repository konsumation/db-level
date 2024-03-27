import { ClassicLevel } from "classic-level";
import { readStreamOptions } from "./util.mjs";
import {
  definePropertiesFromOptions,
  optionJSON
} from "./attribute-extras.mjs";
import { SCHEMA_VERSION_1, description } from "@konsumation/model";

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
   * @return {string} prefix for a given (master) object
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
      description
    };
  }

  /**
   * Get instances without owner.
   * @param {ClassicLevel} db
   * @param {string} prefix
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterable<Base>}
   */
  static async *entries(db, prefix, gte = "\u0000", lte = "\uFFFF") {
    for await (const [key, value] of db.iterator({
      gte: prefix + gte,
      lte: prefix + lte
    })) {
      const name = key.slice(prefix.length);
      yield new this(name, undefined, JSON.parse(value));
    }
  }

  /**
   * Get instances with owner.
   * @param {ClassicLevel} db
   * @param {Object} object
   * @param {string} gte lowest name
   * @param {string} lte highst name
   * @return {AsyncIterable<Base>}
   */
  static async *entriesWith(db, object, gte = "\u0000", lte = "\uFFFF") {
    const prefix = this.keyPrefixWith(object);

    for await (const [key, value] of db.iterator({
      gte: prefix + gte,
      lte: prefix + lte
    })) {
      const name = key.slice(prefix.length);
      yield new this(name, object, JSON.parse(value));
    }
  }

  /**
   * Get a single instance.
   * @param {ClassicLevel} db
   * @param {string} key
   * @return {Promise<Base|undefined>}
   */
  static async entry(db, key) {
    for await (const c of this.entries(db, key)) {
      return c;
    }
  }

  constructor(name, owner, options) {
    if (!name.match(/^[\_\-\w]+$/)) {
      throw new Error(
        "only letters digits '-' and '_' are allowed in names",
        name
      );
    }

    this.name = name;
    this.owner = owner;
    definePropertiesFromOptions(this, options);
  }

  toString() {
    return `${this.name}:`;
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
   * @param {ClassicLevel} db
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

    if (this.owner) {
      await out.write(`${this.owner.typeName}=${this.owner.name}\n`);
    }

    for (const o of Object.keys(this.constructor.attributes)) {
      const v = this[o];
      if (v !== undefined) {
        if (this.owner?.[o] == v) {
          continue;
        }
        await out.write(`${o}=${v}\n`);
      }
    }

    return out.write("\n");
  }

  /**
   * Get detail objects.
   * @param {new (string,owner:Object,data:Object) => factory} factory
   * @param {ClassicLevel} db
   * @param {Object} options
   * @param {string} options.gte from name
   * @param {string} options.lte up to name
   * @param {boolean} options.reverse order
   * @return {AsyncIterable<factory>}
   */
  async *readDetails(factory, db, options) {
    const key = factory.keyPrefixWith(this);

    for await (const [k, value] of db.iterator(
      readStreamOptions(key, options)
    )) {
      const name = k.slice(key.length);
      yield new factory(name, this, JSON.parse(value));
    }
  }

  /**
   * Delete record from database.
   * @param {ClassicLevel} db
   */
  async delete(db) {
    return db.del(this.key);
  }
}
