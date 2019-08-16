import { Category } from "./category.mjs";
import { pump } from "./util.mjs";

export { Category};

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
 * copy all data into out stream as long term ascii data
 * @param database 
 * @param master 
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
