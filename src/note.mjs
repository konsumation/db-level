import { Base } from "./base.mjs";
import { secondsAsString } from "./util.mjs";

export class Note extends Base {
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
