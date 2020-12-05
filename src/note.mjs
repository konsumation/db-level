import { Base } from "./base.mjs";
import { secondsAsString } from "./util.mjs";
import { NOTE_PREFIX } from "./consts.mjs";

export class Note extends Base {
  static get keyPrefix() {
    return NOTE_PREFIX;
  }

  constructor(time, owner, options) {
    super(secondsAsString(time), owner, options);
  }

  get category() {
    return this.owner;
  }

  get keyPrefix() {
    return super.keyPrefix + this.category.name + ".";
  }
}
