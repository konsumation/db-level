import { Note } from "@konsumation/model";
import { NOTE_PREFIX } from "./consts.mjs";

/**
 * Hints placed on a category at a specific time.
 */
export class LevelNote extends Note {

  static get keyPrefix() {
    return NOTE_PREFIX;
  }

  get keyPrefix() {
    return NOTE_PREFIX + this.meter.name + ".";
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
