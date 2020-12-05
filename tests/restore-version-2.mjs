import test from "ava";
import tmp from "tmp";
import { createReadStream, createWriteStream } from "fs";
import levelup from "levelup";
import leveldown from "leveldown";
import {
  initialize,
  backup,
  restore,
  Category,
  SCHEMA_VERSION_2
} from "konsum-db";

test("restore version 2", async t => {
  const fixture = new URL("fixtures/database-version-2.txt", import.meta.url);
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await initialize(db);

  const input = createReadStream(fixture.pathname, { encoding: "utf8" });

  await restore(db, input);

  const categories = [];
  for await (const c of Category.entries(db)) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );

  /*
  const meters = [];
  for await (const m of categories[0].meters(db)) {
    meters.push(m);
  }
  t.deepEqual(
    meters.map(m => m.name),
    ["M-0", "M-1"]
  );
  */

  master.schemaVersion = SCHEMA_VERSION_2;

  const on = tmp.tmpNameSync();

  const out = createWriteStream(on);

  console.log("WRITE: ", on);
  await backup(db, master, out);
});
