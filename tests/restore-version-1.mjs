import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { createReadStream } from "fs";

import { Master, Category } from "@konsumation/db";

test("restore version 1", async t => {
  const fixture = new URL("fixtures/database-version-1.txt", import.meta.url);
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await Master.initialize(db);

  const input = createReadStream(fixture.pathname, { encoding: "utf8" });

  await master.restore(input);

  const categories = [];
  for await (const c of Category.entries(db)) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );
});
