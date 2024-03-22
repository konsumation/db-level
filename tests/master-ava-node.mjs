import test from "ava";
import { createWriteStream, createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import tmp from "tmp";
import { Master, Category, Meter, SCHEMA_VERSION_CURRENT } from "@konsumation/db-level";

test("initialize and reopen", async t => {
  const instance = tmp.tmpNameSync();
  const master = await Master.initialize(instance);

  t.is(master.schemaVersion, SCHEMA_VERSION_CURRENT);
  t.truthy(master.db);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  master.close();

  const master2 = await Master.initialize(instance);
  t.is(master2.schemaVersion, SCHEMA_VERSION_CURRENT);
  t.truthy(master2.db);
});

const SECONDS_A_DAY = 60 * 60 * 24;

test("backup as version 2", async t => {
  const master = await Master.initialize(tmp.tmpNameSync());

  //master.schemaVersion = SCHEMA_VERSION_2;

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

    for (let i = 0; i < 10; i++) {
      last = new Date(first + SECONDS_A_DAY * i).getTime();
      lastValue = firstValue + i;
      await c.writeValue(master.db, lastValue, last);
    }
  }

  const ofn = tmp.tmpNameSync();
  const out = createWriteStream(ofn, { encoding: "utf8" });

  await master.backup(out);

  const s = await stat(ofn);

  //console.log(ofn);
  t.is(s.size, 1070);
  master.close();

  const master2 = await Master.initialize(tmp.tmpNameSync());
  const input = createReadStream(ofn, { encoding: "utf8" });

  await master2.restore(input);
});
