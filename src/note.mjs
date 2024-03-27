import { Base } from "./base.mjs";
import { secondsAsString } from "./util.mjs";
import { NOTE_PREFIX } from "./consts.mjs";

/**
 * Hints placed on a category at a specific time.
 */
export class Note extends Base {
  constructor(time, owner, options) {
    super(secondsAsString(time), owner, options);
  }

  get category() {
    return this.owner;
  }

  get keyPrefix() {
    return NOTE_PREFIX + this.category.name + ".";
  }
}
