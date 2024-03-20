import { ClassicLevel } from "classic-level";
import { Category } from "./category.mjs";
import { Meter } from "./meter.mjs";
import { Note } from "./note.mjs";
import {
  MASTER,
  VALUE_PREFIX,
  SCHEMA_VERSION_1,
  SCHEMA_VERSION_2,
  SCHEMA_VERSION_CURRENT
} from "./consts.mjs";
import { Base } from "./base.mjs";
import { pump, secondsAsString } from "./util.mjs";
import { description, schemaVersion } from "./attributes.mjs";

export {
  Base,
  Category,
  Meter,
  Note,
  secondsAsString,
  SCHEMA_VERSION_1,
  SCHEMA_VERSION_2,
  SCHEMA_VERSION_CURRENT,
  VALUE_PREFIX
};

const supportedVersions = new Set([SCHEMA_VERSION_1, SCHEMA_VERSION_2]);

function checkVersion(meta) {
  if (!supportedVersions.has(meta.schemaVersion)) {
    throw new Error(
      `Unsupported schema version ${meta.schemaVersion} only supporting ${[
        ...supportedVersions
      ]}`
    );
  }
}

/**
 * Master record.
 * Holds schema version.
 *
 * @property {string} schemaVersion
 */
export class Master extends Base {
  static get keyPrefix() {
    return MASTER;
  }

  static get attributes() {
    return {
      description,
      schemaVersion
    };
  }

  /**
   * Initialize database.
   * checks/writes master record.
   * @param {string} directory
   * @return {Promise<Master>}
   */
  static async initialize(directory) {

    const db = new ClassicLevel(directory);
    let meta;

    try {
      for await (const [key, value] of db.iterator({
        gte: MASTER,
        lte: MASTER
      })) {
        meta = JSON.parse(value);
      }
    } catch (err) {
      console.error(err)
    }

    if (!meta) {
      meta = {
        schemaVersion: SCHEMA_VERSION_CURRENT
      };
      checkVersion(meta);
      await db.put(MASTER, JSON.stringify(meta));
    }

    const master = new Master("unnamed", undefined, meta);
    master.db = db;

    return master;
  }

  /** @type {ClassicLevel} */ db;
  
  /**
   * Close the underlaying database.
   */
  close() {
    return this.db.close();
  }

  /**
   * List Categories.
   * @param {string} gte
   * @param {string} lte
   */
  async *categories(gte, lte) {
    yield* Category.entries(this.db, gte, lte);
  }

  async category(name) {
    for await (const category of this.categories(name, name)) {
      return category;
    }
  }

  /**
   * Copy all data into out stream as long time text data.
   * @param {Writeable} out
   */
  async backup(out) {
    out.write(`schemaVersion=${this.schemaVersion}\n\n`);

    for await (const category of Category.entries(this.db)) {
      await category.writeAsText(out, category.name, this);

      await pump(category.readStream(this.db), out);
      out.write("\n");

      for await (const note of category.notes(this.db)) {
        await note.writeAsText(out, note.name, this);
      }

      for await (const meter of category.meters(this.db)) {
        await meter.writeAsText(out, meter.name, this);
      }
    }

    return new Promise((resolve, reject) => {
      out.end(undefined, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Restore database from input stream.
   * @param {ReadableStream} input data from backup
   */
  async restore(input) {
    const categories = new Map();

    let last = "";
    let owner = this;
    let c, name, factory, value, lastValue;
    let attributes = {};
    let numberOfValues = 0;
    
    const insert = () => {
      if (name) {
        if (attributes.category) {
          owner = categories.get(attributes.category);
          delete attributes.category;
        }
        //console.log("NEW", factory.name, name, owner, attributes);

        c = new factory(name, owner, attributes);
        c.write(this.db);

        if (factory === Category) {
          categories.set(c.name, c);
        }

        name = undefined;
        lastValue = 0;
      } else {
        if (factory === undefined) {
          checkVersion(attributes);
          Object.assign(this, attributes);
        }
      }
    };

    const process = line => {
      let m = line.match(/^(\w+)\s*=\s*(.*)/);
      if (m) {
        attributes[m[1]] = m[2];
        return;
      }

      m = line.match(/^\[(\w+)\s+"([^"]+)"\]/);
      if (m) {
        insert();

        switch (m[1]) {
          case "category":
            factory = Category;
            break;
          case "meter":
            factory = Meter;
            break;
          case "note":
            factory = Note;
            break;
        }
        attributes = {};
        name = m[2];
        return;
      }

      m = line.match(/^\[([^\]]+)\]/);
      if (m) {
        factory = Category;
        attributes = {};
        name = m[1];
        return;
      }

      insert();

      m = line.match(/^([\d\.]+)\s+([\d\.]+)/);
      if (m) {
        value = parseFloat(m[1]);

        if (value < lastValue) {
          console.log(`Value decreasing ${c.name}: ${value} < ${lastValue}`);
        }
        lastValue = value;
        c.writeValue(this.db, parseFloat(m[2]), value);
        numberOfValues += 1;
      }
    };

    for await (const chunk of input) {
      last += chunk;

      const lines = last.split(/\n/);

      last = lines.pop();

      for (const line of lines) {
        process(line);
      }
    }

    process(last);

    return { numberOfValues, numberOfCategories: categories.size };
  }
}
