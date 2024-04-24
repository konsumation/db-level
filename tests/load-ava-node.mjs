import test from "ava";
import { createWriteStream } from "node:fs";
import tmp from "tmp";
import { createData } from "@konsumation/db-test";
import Master from "@konsumation/db-level";

test("backup", async t => {
  const master = await Master.initialize(tmp.tmpNameSync());
  const context = master.context;

  createData(
    master,
    Array.from({ length: 3 }, (_, i) => `CAT-${i}`),
    Array.from({ length: 2 }, (_, i) => `M-${i}`),
    10000,
    new Date(),
    60,
    1.0,
    0.1
  );

  const ofn = tmp.tmpNameSync();
  const out = createWriteStream(ofn, { encoding: "utf8" });

  let n = 0;
  for await (const line of master.text(context)) {
   // console.log(line);
    n++;
  }
  //t.log(n);
  t.true(n >= 1210);
});
