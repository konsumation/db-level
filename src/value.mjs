import { Value } from "@konsumation/model";
import { VALUE_PREFIX } from "./consts.mjs";
import { secondsAsString } from "./util.mjs";

/**
 * Hints placed on a category at a specific time.
 */
export class LevelValue extends Value {
  static keyPrefixWith(owner) {
    return VALUE_PREFIX + owner.category.name + "." + owner.name + ".";
  }

  get keyPrefix() {
    // @ts-ignore
    return this.constructor.keyPrefixWith(this.meter);
  }

  /**
   * @return {string}
   */
  get key() {
    return this.keyPrefix + secondsAsString(this.date.getTime() / 1000);
  }

  async write(db) {
    return db.put(this.key, this.value);
  }
}
