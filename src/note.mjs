import { Base } from "./base.mjs";
import { secondsAsString } from "./util.mjs";
import { NOTE_PREFIX } from "./consts.mjs";

export class Note extends Base {
  static get keyPrefix() {
    return NOTE_PREFIX;
  }

  constructor(time, category, options) {
    super(secondsAsString(time), options);
    Object.defineProperties(this, { category: { value: category } });
  }

  get keyPrefix() {
    return super.keyPrefix + this.category.name + ".";
  }
}
