const SUPER = "super";
const CATEGORY_PREFIX = "categories.";
const VALUE_PREFIX = "values.";

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
  static async *entries(db, start='A', end='_' ) {
    for await (const data of db.createReadStream({ start: CATEGORY_PREFIX + start , end: CATEGORY_PREFIX + end })) {
      const name = data.key.toString().substring(CATEGORY_PREFIX.length);
      yield new Category(name, JSON.parse(data.value.toString()));
    }
  }


  async insertValue(db, value, time) {
    const key = VALUE_PREFIX + this.name + '.' + time;
    return db.put(key, value);
  }

  async * values(db) {
    const key = VALUE_PREFIX + this.name;
    for await (const data of db.createReadStream()) {

      yield { value: data.value };
    }
  }
}
