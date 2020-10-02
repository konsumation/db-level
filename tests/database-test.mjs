import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";

import { initialize, backup, restore, Category } from "konsum-db";
import fs, { createWriteStream, createReadStream } from "fs";

test("initialize", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));

  const master = await initialize(db);

  t.is(master.schemaVersion, "1");

  db.close();
});

const SECONDS_A_DAY = 60 * 60 * 24;

test("backup", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const ofn = tmp.tmpNameSync();

  const master = await initialize(db);

  for (let i = 0; i < 3; i++) {
    const c = new Category(`CAT-${i}`, {
      unit: "kWh",
      fractionalDigits: 2,
      description: "mains power"
    });
    await c.write(db);

    const first = Date.now();
    const firstValue = 77.34 + i;
    let last = first;
    let lastValue = firstValue;

    for (let i = 0; i < 10; i++) {
      last = new Date(first + SECONDS_A_DAY * i).getTime();
      lastValue = firstValue + i;
      await c.writeValue(db, lastValue, last);
    }
  }

  const out = createWriteStream(ofn, { encoding: "utf8" });

  await backup(db, master, out);

  const stat = await fs.promises.stat(ofn);

  t.is(stat.size, 620);
  db.close();

  const db2 = await levelup(leveldown(tmp.tmpNameSync()));
  const input = createReadStream(ofn, { encoding: "utf8" });

  await restore(db2, input);
});
