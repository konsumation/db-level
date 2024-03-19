import test from "ava";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import tmp from "tmp";
import { Master, Category } from "@konsumation/db-level";

test("restore version 1", async t => {
  const master = await Master.initialize(tmp.tmpNameSync());

  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-1.txt", import.meta.url)),
    { encoding: "utf8" }
  );
  await master.restore(input);

  const categories = [];
  for await (const c of Category.entries(master.db)) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );
});
