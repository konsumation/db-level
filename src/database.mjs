export { Category } from "./category.mjs";

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
    start: MASTER,
    end: MASTER
  })) {
    const master = JSON.parse(data.value.toString());
    if (master.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `invalid schema version ${
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
