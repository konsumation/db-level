import { ClassicLevel } from "classic-level";
import {
  SCHEMA_VERSION_2,
  SCHEMA_VERSION_3,
  SCHEMA_VERSION_CURRENT,
  Master,
  Base
} from "@konsumation/model";

import { LevelCategory } from "./category.mjs";
import { LevelMeter } from "./meter.mjs";
import { LevelNote } from "./note.mjs";
import { MASTER, VALUE_PREFIX } from "./consts.mjs";
import { secondsAsString } from "./util.mjs";

export {
  LevelCategory,
  LevelMeter,
  LevelNote,
  secondsAsString,
  SCHEMA_VERSION_2,
  SCHEMA_VERSION_3,
  SCHEMA_VERSION_CURRENT,
  VALUE_PREFIX
};

/**
 * Master record.
 * Holds schema version.
 *
 * @property {string} schemaVersion
 */
export class LevelMaster extends Master {
  static get factories() {
    return {
      [LevelCategory.typeName]: LevelCategory,
      [LevelMeter.typeName]: LevelMeter,
      [LevelNote.typeName]: LevelNote
    };
  }

  static get name() {
    return "level";
  }

  static get keyPrefix() {
    return MASTER;
  }

  /**
   * Initialize database.
   * checks/writes master record.
   * @param {string} directory
   * @return {Promise<Master>}
   */
  static async initialize(directory) {
    const context = new ClassicLevel(directory);
    let values;

    try {
      for await (const [key, value] of context.iterator({
        gte: MASTER,
        lte: MASTER
      })) {
        values = JSON.parse(value);
      }
    } catch (err) {
      console.error(err);
    }

    if (!values) {
      values = {
        schemaVersion: SCHEMA_VERSION_CURRENT
      };
      //this.checkVersion(values);
      await context.put(MASTER, JSON.stringify(values));
    }

    const master = new LevelMaster(values);
    master.context = context;

    return master;
  }

  /**
   * Close the underlaying database.
   */
  async close() {
    await this.context.close();
    this.context = undefined;
  }

  /**
   * List Categories.
   * @param {string} [gte]
   * @param {string} [lte]
   */
  async *categories(gte, lte) {
    yield* LevelCategory.entries(this.context, gte, lte);
  }

  async category(name) {
    for await (const category of this.categories(name, name)) {
      return category;
    }
  }
}

Base.keyPrefixWith = function (object) {
  return this.keyPrefix + object.name + ".";
};

Base.entry = async function entry(db, key) {
  for await (const object of this.entries(db, key)) {
    return object;
  }
};
