import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { Master, Category, Meter } from "@konsumation/db";

test("create Meter", async t => {
  const master = {};
  const c = new Category("CAT-1", master, { unit: "kWh", fractionalDigits: 2 });
  const m1 = new Meter("M1", c, { serial: "1234567" });

  t.is(m1.key, "meters.CAT-1.M1");
  t.is(m1.name, "M1");
  t.is(m1.unit, "kWh");
  t.is(m1.fractionalDigits, 2);
  t.is(m1.serial, "1234567");
});

test("create Meter with unit", async t => {
  const master = {};

  const c = new Category("CAT-1", master, { fractionalDigits: 2 });
  const m1 = new Meter("M1", c, {
    serial: "1234567",
    unit: "m3",
    fractionalDigits: 3
  });

  t.is(m1.key, "meters.CAT-1.M1");
  t.is(m1.name, "M1");
  t.is(m1.unit, "m3");
  t.is(m1.fractionalDigits, 3);
  t.is(m1.serial, "1234567");
});

test("Meter write / read", async t => {
  const master = await Master.initialize(
    await levelup(leveldown(tmp.tmpNameSync()))
  );

  const c = new Category("CAT-1", master, { unit: "kWh", fractionalDigits: 3 });
  await c.write(master.db);

  for (let i = 0; i < 5; i++) {
    const m = new Meter(`M-${i}`, c, { serial: i });
    await m.write(master.db);
  }

  const ms = [];

  for await (const m of Meter.entriesWith(master.db, c)) {
    ms.push(m);
  }

  t.true(ms.length >= 5);
  t.is(ms[0].unit, "kWh");

  master.close();
});
