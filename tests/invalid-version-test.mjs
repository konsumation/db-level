import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { createReadStream } from "fs";
import { Master } from "@konsumation/db";
import { fileURLToPath } from "url";

test("restore invalid version", async (t) => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await Master.initialize(db);
  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-0.txt", import.meta.url)),
    { encoding: "utf8" }
  );

  try {
    await master.restore(input);
    t.fail("should throw");
  } catch (e) {
    t.is(e.message, "Unsupported schema version 0 only supporting 1,2");
  }
});
