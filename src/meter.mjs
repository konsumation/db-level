import { Base } from "./base.mjs";
import { METER_PRFIX } from "./category.mjs";

/**
 * Meter
 * @param {string} name meter name
 * @param {Category} category
 * @param {Object} options
 * @param {string} options.description
 * @param {string} options.unit physical unit like kWh or m3
 *
 * @property {string} name category name
 * @property {string} description
 * @property {string} unit physical unit
 */
export class Meter extends Base {
  static get attributes() {
    return {
      ...super.attributes,
      serial: { type: "string" }
    };
  }
  
  constructor(name,category,options) {
    super(name,options);
    Object.defineProperties(this,{ category: { value: category }});
  }
  
  get unit()
  {
    retun this.category.unit;
  }
  
   /**
   * Write the Meter.
   * @param {levelup} db
   */
  async write(db) {
    const key = METER_PREFIX + this.name;
    return db.put(
      key,
      JSON.stringify({
        description: this.description
      })
    );
  }
}
