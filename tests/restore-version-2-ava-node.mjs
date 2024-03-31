import test from "ava";
import tmp from "tmp";
import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SCHEMA_VERSION_2 } from "@konsumation/model";
import { Master } from "@konsumation/db-level";

test("restore version 2", async t => {
  const master = await Master.initialize(tmp.tmpNameSync());

  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-2.txt", import.meta.url)),
    { encoding: "utf8" }
  );
  const { numberOfValues, numberOfCategories } = await master.restore(input);

  t.is(numberOfCategories, 3);
  t.is(numberOfValues, 3 * 10);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );

  const meters = [];
  for await (const m of categories[0].meters(master.db)) {
    meters.push(m);
  }
  t.deepEqual(
    meters.map(m => m.name),
    ["M-0", "M-1"]
  );
});
