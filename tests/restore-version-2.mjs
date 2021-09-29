import test from "ava";
import tmp from "tmp";
import { createReadStream, createWriteStream } from "fs";
import { stat } from "fs/promises";

import levelup from "levelup";
import leveldown from "leveldown";
import { Master, SCHEMA_VERSION_2 } from "@konsumation/db";

test("restore version 2", async t => {
  const fixture = new URL("fixtures/database-version-2.txt", import.meta.url);
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await Master.initialize(db);

  const input = createReadStream(fixture.pathname, { encoding: "utf8" });

  await master.restore(input);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );

  const meters = [];
  for await (const m of categories[0].meters(db)) {
    meters.push(m);
  }
  t.deepEqual(
    meters.map(m => m.name),
    ["M-0", "M-1"]
  );
});

test("read write version 2", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await Master.initialize(db);

  const fixture = new URL("fixtures/database-version-2.txt", import.meta.url);

  const fi = await stat(fixture);

  await master.restore(
    createReadStream(fixture.pathname, { encoding: "utf8" })
  );
  t.is(master.schemaVersion,SCHEMA_VERSION_2);

  const ofn = tmp.tmpNameSync();
  //console.log(ofn);
  await master.backup(createWriteStream(ofn, { encoding: "utf8" }));

  const fo = await stat(ofn);

  t.is(fi.size, fo.size);
  t.is(fi.size,  1021);
});
