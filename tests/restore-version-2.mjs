import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";

import { restore, Category } from "konsum-db";
import { createReadStream } from "fs";

test("restore version 2", async t => {
  const fixture = new URL("fixtures/database-version-2.txt", import.meta.url);
  const db = await levelup(leveldown(tmp.tmpNameSync()));
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
});
