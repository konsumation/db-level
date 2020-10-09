import { Category } from "./category.mjs";
import { Meter } from "./meter.mjs";
import { Note } from "./note.mjs";
import { MASTER, SCHEMA_VERSION_1 } from "./consts.mjs";
import { Base } from "./base.mjs";
import { pump } from "./util.mjs";

export { Category, Meter, Note };

export class Database extends Base {
  static get keyPrefix() {
    return MASTER;
  }

  static get attributes() {
    return {
      ...super.attributes,
      schemaVersion: { type: "string" }
    };
  }
}

/**
 * Initialize database
 * checks/writes master record
 * @param {levelup} db
 */
export async function initialize(db) {
  for await (const data of db.createReadStream({
    gte: MASTER,
    lte: MASTER
  })) {
    const master = JSON.parse(data.value.toString());
    if (master.schemaVersion !== SCHEMA_VERSION_1) {
      throw new Error(
        `Unsupported schema version ${master.schemaVersion} only supporting version ${SCHEMA_VERSION_1}`
      );
    }

    return master;
  }

  const master = {
    schemaVersion: SCHEMA_VERSION_1
  };
  await db.put(MASTER, JSON.stringify(master));
  return master;
}

/**
 * Copy all data into out stream as long time text data
 * @param {levelup} database
 * @param {Object} master
 * @param {Writeable} out
 */
export async function backup(database, master, out) {
  out.write(`schemaVersion=${master.schemaVersion}\n\n`);

  for await (const category of Category.entries(database)) {
    await category.writeAsText(out, category.name, master);
    /*for await (const meter of category.meters(database)) {
      await meter.writeAsText(out, category.name + "." + meter.name, master);
    }*/

    await pump(category.readStream(database), out);
  }
}

/**
 * Restore database from input stream
 * @param {levelup} database
 * @param {Readable} input data from backup
 */
export async function restore(database, input) {
  let last = "";

  let c;
  let attributes;
  let cn;
  let factory;

  function process(line) {
    let m = line.match(/^(\w+)\s*=\s*(.*)/);
    if (m) {
      if (attributes === undefined) {
        attributes = {};
      }
      attributes[m[1]] = m[2];
      return;
    }

    m = line.match(/^\[(\w+)\s+"([^"]+)"\]/);
    if (m) {
      switch (m[1]) {
        case "category":
          factory = Category;
          break;
        case "meter":
          factory = Meter;
          break;
      }
      attributes = undefined;
      cn = m[2];
      return;
    }

    m = line.match(/^\[([^\]]+)\]/);
    if (m) {
      factory = Category;
      attributes = undefined;
      cn = m[1];
      return;
    }

    if (cn !== undefined) {
      c = new factory(cn, attributes);
      c.write(database);
      cn = undefined;
    }

    m = line.match(/^([\d\.]+)\s+([\d\.]+)/);
    if (m) {
      c.writeValue(database, parseFloat(m[2]), parseFloat(m[1]));
    }
  }

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
