import levelup from "levelup";
import leveldown from "leveldown";
import { Master } from "konsum-db";

export const defaultDatabaseConfig = {
  database: {
    file: "${statedir}/db"
  }
};

export async function prepareDatabase(config) {
  const master = await Master.initialize(await levelup(leveldown(config.database.file)));
  return { master };
}
