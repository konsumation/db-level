import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { Category, Meter } from "konsum-db";

test("create Meter", async t => {
  const c = new Category("CAT-1", { unit: "kWh", fractionalDigits: 3 });
  const m1 = new Meter("M1", c, { serial: "1234567" });

  t.is(m1.name, "M1");
  t.is(m1.unit, "kWh");
  t.is(m1.serial, "1234567");
});


test("Meter write / read", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));

  const c = new Category("CAT-1", { unit: "kWh", fractionalDigits: 3 });
  await c.write(db);

  for (let i = 0; i < 5; i++) {
    const m = new Meter(`M-${i}`, c, { serial: i });
    await m.write(db);
  }

  const ms = [];

  for await (const m of Meter.entries(db)) {
    ms.push(m);
  }

  t.true(ms.length >= 5);
  t.is(ms[0].unit, "kWh");

  db.close();
});
