const CATEGORY_PREFIX = "categories.";
const VALUE_PREFIX = "values.";

const MASTER = "master";
const SCHEMA_VERSION = '1'

/**
 * @param {string} name category name
 * @param {Object} options
 * @param {string} options.unit physical unit
 *
 * @property {string} name category name
 * @property {string} unit physical unit
 */
export class Category {
  constructor(name, options) {
    Object.defineProperties(this, {
      name: { value: name },
      unit: { value: options.unit }
    });
  }

  toString() {
    return `${this.name}: ${this.unit}`;
  }

  toJSON() {
    return {
      name: this.name,
      unit: this.unit
    };
  }

  /**
   * initialize database
   * checks/writes master record
   * @param {levelup} db
   */
  async initialize(db) {
    for await (const data of db.createReadStream({ start: MASTER, end: MASTER })) {
      const master = JSON.parse(data.value.toString());
      if(master.schemaVersion !== SCHEMA_VERSION) {
        throw new Error(`invalid schema version ${master.schemaVersion}`);
      }

      return master;
    }

    const master = { schemaVersion: SCHEMA_VERSION };
    await db.put(MASTER, JSON.stringify(master));
    return master;
  }

  /**
   * write the category
   * @param {levelup} db
   */
  async write(db) {
    const key = CATEGORY_PREFIX + this.name;
    return db.put(key, JSON.stringify({ unit: this.unit }));
  }

  /**
   * get all categories
   * @param {levelup} db
   */
  static async *entries(db, gte='\u0000', lte='\uFFFF' ) {
    for await (const data of db.createReadStream({ gte: CATEGORY_PREFIX + gte , lte: CATEGORY_PREFIX + lte })) {
      const name = data.key.toString().substring(CATEGORY_PREFIX.length);
      yield new Category(name, JSON.parse(data.value.toString()));
    }
  }


  /**
   * write a time/value pair
   * @param {levelup} db
   * @param {number} value
   * @param {string} time
   */
  async writeValue(db, value, time) {
    const key = VALUE_PREFIX + this.name + '.' + time;
    return db.put(key, value);
  }

  /**
   * get all values of the category
   * @param {levelup} db
   * @param {string} gte
   * @param {string} lte
   * @return {Iterator<object>}
   */
  async * values(db, gte='\u0000', lte='\uFFFF') {
    const key = VALUE_PREFIX + this.name + '.';
    for await (const data of db.createReadStream({ gte: key + gte , lte: key + lte })) {
      const time = data.key.toString().substring(key.length);
      yield { value: data.value, time };
    }
  }
}
