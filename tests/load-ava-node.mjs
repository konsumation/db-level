import test from "ava";
import { createWriteStream } from "node:fs";
import tmp from "tmp";
import { createData } from "@konsumation/db-test";
import { LevelMaster } from "@konsumation/db-level";

test("backup", async t => {
  const master = await LevelMaster.initialize(tmp.tmpNameSync());

  createData(
    master,
    Array.from({ length: 3 }, (_, i) => `CAT-${i}`),
    Array.from({ length: 2 }, (_, i) => `M-${i}`),
    10000, new Date(), 60, 1.0, 0.1
  );

  const ofn = tmp.tmpNameSync();
  const out = createWriteStream(ofn, { encoding: "utf8" });
  for await(const line of master.text()) {
    console.log(line);
  }

  t.true(true);
});
