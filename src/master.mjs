import { Category } from "./category.mjs";
import { Meter } from "./meter.mjs";
import { Note } from "./note.mjs";
import { MASTER, SCHEMA_VERSION_1, SCHEMA_VERSION_2 } from "./consts.mjs";
import { Base } from "./base.mjs";
import { pump } from "./util.mjs";

export { Category, Meter, Note, SCHEMA_VERSION_1, SCHEMA_VERSION_2 };

/**
 * Master record
 * holds schema version.
 *
 * @property {string} schemaVersion
 */
export class Master extends Base {
  static get keyPrefix() {
    return MASTER;
  }

  static get attributes() {
    return {
      ...super.attributes,
      schemaVersion: { type: "string" }
    };
  }

  /**
   * Initialize database.
   * checks/writes master record.
   * @param {levelup} db
   * @return {Master}
   */
  static async initialize(db) {
    let meta;

    for await (const data of db.createReadStream({
      gte: MASTER,
      lte: MASTER
    })) {
      meta = JSON.parse(data.value.toString());
      if (meta.schemaVersion !== SCHEMA_VERSION_1) {
        throw new Error(
          `Unsupported schema version ${meta.schemaVersion} only supporting version ${SCHEMA_VERSION_1}`
        );
      }
      break;
    }

    if (!meta) {
      meta = {
        schemaVersion: SCHEMA_VERSION_1
      };
      await db.put(MASTER, JSON.stringify(meta));
    }

    const master = new Master("unnamed", undefined, meta);
    master.db = db;

    return master;
  }

  /**
   * Close the underlaying database.
   */
  close() {
    return this.db.close();
  }

  /**
   * List Categories
   * @param {string} gte
   * @param {string} lte
   */
  async *categories(gte, lte) {
    yield* Category.entries(this.db, gte, lte);
  }

  async category(name)
  {
    for await( const category of this.categories(name,name)) {
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
      /*for await (const meter of category.meters(database)) {
      await meter.writeAsText(out, category.name + "." + meter.name, master);
    }*/

      await pump(category.readStream(this.db), out);
    }
  }

  /**
   * Restore database from input stream.
   * @param {Readable} input data from backup
   */
  async restore(input) {
    const categories = new Map();

    let last = "";
    let owner = this;
    let c, cn, factory, value, lastValue;
    let attributes = {};

    const insert = () => {
      if (cn) {
        if (attributes.category) {
          owner= categories.get(attributes.category);
          delete attributes.category;
        }
        //console.log("NEW", factory.name, cn, owner, attributes);

        c = new factory(cn, owner, attributes);
        c.write(this.db);

        if(factory === Category) {
          categories.set(c.name,c);
        }
        
        cn = undefined;
        lastValue = 0;
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
        cn = m[2];
        return;
      }

      m = line.match(/^\[([^\]]+)\]/);
      if (m) {
        factory = Category;
        attributes = {};
        cn = m[1];
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
  }
}
