import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { createWriteStream, createReadStream } from "fs";
import { stat } from "fs/promises";

import { Master, Category, Meter } from "@konsumation/db";

test("initialize", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const master = await Master.initialize(db);

  t.is(master.schemaVersion, "2");
  t.is(master.db, db);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  db.close();
});

const SECONDS_A_DAY = 60 * 60 * 24;

test("backup as version 2", async t => {
  const master = await Master.initialize(
    await levelup(leveldown(tmp.tmpNameSync()))
  );

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

  const master2 = await Master.initialize(
    await levelup(leveldown(tmp.tmpNameSync()))
  );
  const input = createReadStream(ofn, { encoding: "utf8" });

  await master2.restore(input);
});
