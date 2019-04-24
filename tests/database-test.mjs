import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";

import { initialize } from "../src/database.mjs";

test("initialize", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));

  const master = await initialize(db);

  t.is(master.schemaVersion, '1');

  db.close();
});
