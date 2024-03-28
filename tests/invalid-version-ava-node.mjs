import test from "ava";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import tmp from "tmp";
import { Master } from "@konsumation/db-level";

test("restore invalid version", async t => {
  const master = await Master.initialize(tmp.tmpNameSync());
  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-0.txt", import.meta.url)),
    { encoding: "utf8" }
  );

  try {
    await master.restore(input);
    t.fail("should throw");
  } catch (e) {
    t.is(e.message, "Unsupported schema version 0 only supporting 2,3");
  }
});
