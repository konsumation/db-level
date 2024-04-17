import { Value } from "@konsumation/model";
import { VALUE_PREFIX } from "./consts.mjs";
import {
    secondsAsString
  } from "./util.mjs";
  
/**
 * Hints placed on a category at a specific time.
 */
export class LevelValue extends Value {

  static get keyPrefix() {
    return VALUE_PREFIX;
  }

  get keyPrefix() {
    return VALUE_PREFIX + this.meter.name + ".";
  }

  /**
   * @return {string}
   */
  get key() {
    return VALUE_PREFIX + this.meter.name + "." + secondsAsString(this.date.getTime() / 1000)
  }

  async write(db) {
    return db.put(this.key, this.value);
  }
}
