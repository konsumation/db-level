import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";

import { Master, Category } from "konsum-db";
import { createReadStream } from "fs";

test.skip("restore invalid version", async t => {
  const fixture = new URL("fixtures/database-version-0.txt", import.meta.url);
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await Master.initialize(db);
  const input = createReadStream(fixture.pathname, { encoding: "utf8" });

  try {
    await master.restore(input);
    t.true(false);
  } catch(e) {
  }
});
