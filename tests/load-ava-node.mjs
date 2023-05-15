import test from "ava";
import { createWriteStream } from "node:fs";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";

import { Master, Category, Meter, SCHEMA_VERSION_2 } from "@konsumation/db";

test("backup as version 2", async t => {
  const master = await Master.initialize(
    await levelup(leveldown(tmp.tmpNameSync()))
  );

  master.schemaVersion = SCHEMA_VERSION_2;

  for (let i = 0; i < 3; i++) {
    const c = new Category(`CAT-${i}`, master, {
      unit: "kWh",
      fractionalDigits: 2,
      description: "mains power"
    });

    await c.write(master.db);
    const m1 = new Meter("M-1", c, { serial: "1" });
    m1.write(master.db);
    const m2 = new Meter("M-2", c, { serial: "2" });
    m2.write(master.db);

    const first = Date.now();
    const firstValue = 77.34 + i;
    let last = first;
    let lastValue = firstValue;

    for (let i = 0; i < 100000; i++) {
      last = new Date(first + 60 * i).getTime();
      lastValue = firstValue + i;
      await c.writeValue(master.db, lastValue, last);
    }
  }

  const ofn = tmp.tmpNameSync();
  const out = createWriteStream(ofn, { encoding: "utf8" });

  await master.backup(out);

  t.true(true);
});
