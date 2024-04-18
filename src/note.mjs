import { Note } from "@konsumation/model";
import { NOTE_PREFIX } from "./consts.mjs";

/**
 * Hints placed on a category at a specific time.
 */
export class LevelNote extends Note {

  static keyPrefixWith(owner) {
    return NOTE_PREFIX + owner.category.name + "." + owner.name + ".";
  }

  get keyPrefix() {
    // @ts-ignore
    return this.constructor.keyPrefixWith(this.meter);
  }

  /**
   * @return {string}
   */
  get key() {
    return this.keyPrefix + this.name;
  }

  async write(db) {
    return db.put(this.key, JSON.stringify(this.toJSON()));
  }
}
