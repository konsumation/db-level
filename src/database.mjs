import { Category } from "./category.mjs";
import { pump } from "./util.mjs";

export { Category };

/**
 * prefix of the master record
 */
const MASTER = "master";

/**
 * current schema version
 */
const SCHEMA_VERSION = "1";

/**
 * initialize database
 * checks/writes master record
 * @param {levelup} db
 */
export async function initialize(db) {
  for await (const data of db.createReadStream({
    gte: MASTER,
    lte: MASTER
  })) {
    const master = JSON.parse(data.value.toString());
    if (master.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `Unsupported schema version ${
          master.schemaVersion
        } only supporting version ${SCHEMA_VERSION}`
      );
    }

    return master;
  }

  const master = {
    schemaVersion: SCHEMA_VERSION
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
  out.write(`schemaVersion = ${master.schemaVersion}\n\n`);

  for await (const c of Category.entries(database)) {
    await out.write(`[${c.name}]\n`);
    await out.write(`description=${c.description}\n`);
    await out.write(`unit=${c.unit}\n\n`);
    await pump(c.readStream(database), out);
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

  function process(line) {
    let m = line.match(/^(\w+)\s*=\s*(.*)/);
    if (m) {
      if(attributes === undefined) { attributes = {}; }
      attributes[m[1]]= m[2];
      return;
    }

    m = line.match(/^\[([^\]]+)\]/);
    if (m) {
      attributes = undefined;
      cn = m[1];
      return;
    }

    if(cn !== undefined) {
      c = new Category(cn, attributes);
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

    let lines = last.split(/\n/);

    last = lines.pop();

    for (const line of lines) {
      process(line);
    }
  }

  process(last);
}
