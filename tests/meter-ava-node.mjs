import test from "ava";
import tmp from "tmp";
import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";
import {
  LevelMaster,
  LevelCategory,
  LevelMeter,
  LevelValue
} from "@konsumation/db-level";
import { METER_PREFIX } from "../src/consts.mjs";

test("Meter key", t =>
  t.is(
    new LevelMeter({
      name: "M-1",
      category: new LevelCategory({
        name: "CAT-1"
      })
    }).key,
    METER_PREFIX + "CAT-1.M-1"
  ));

test("create Meter", async t => {
  const category = new LevelCategory({
    name: "CAT-1",
    unit: "kWh",
    fractionalDigits: 2
  });
  const meter = new LevelMeter({ name: "M1", category, serial: "1234567" });

  t.is(meter.key, "meters.CAT-1.M1");
  t.is(meter.name, "M1");
  t.is(meter.unit, "kWh");
  t.is(meter.fractionalDigits, 2);
  t.is(meter.serial, "1234567");
});

test("create Meter with unit", async t => {
  const category = new LevelCategory({ name: "CAT-1", fractionalDigits: 2 });
  const meter = new LevelMeter({
    name: "M1",
    category,
    serial: "1234567",
    unit: "m3",
    fractionalDigits: 3
  });

  t.is(meter.category, category);
  t.is(meter.name, "M1");
  t.is(meter.key, "meters.CAT-1.M1");
  t.is(meter.unit, "m3");
  t.is(meter.fractionalDigits, 3);
  t.is(meter.serial, "1234567");
  t.deepEqual(meter.validFrom, new Date(0));
});

test("Meter write / read", async t => {
  const master = await LevelMaster.initialize(tmp.tmpNameSync());
  const context = master.context;

  const category = new LevelCategory({
    name: "CAT-1",
    unit: "kWh",
    fractionalDigits: 3
  });
  await category.write(context);

  for (let i = 0; i < 2; i++) {
    const meter = new LevelMeter({
      name: `M-${i}`,
      category,
      serial: String(i)
    });
    await meter.write(context);
  }

  const ms = [];

  for await (const m of LevelMeter.entriesWith(context, category)) {
    ms.push(m);
  }
  t.true(ms.length >= 2);
  t.is(ms[0].unit, "kWh");
  t.deepEqual(ms[0].validFrom, new Date(0));

  await master.close();
});

const MSECONDS_A_DAY = 60 * 60 * 24 * 1000;

test("values write / read", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await LevelMaster.initialize(dbf);
  const context = master.context;

  const category = master.addCategory(context, { name: "CAT-1", unit: "kWh" });
  await category.write(context);
  const meter = category.addMeter(context, { name: "M-1", serial: "123" });
  await meter.write(context);

  const first = new Date(Math.floor(Date.now() / 1000) * 1000);
  const firstValue = 77.34;

  for (let i = 0; i < 100; i++) {
    const value = await meter.addValue(context, {
      date: new Date(first.getTime() + MSECONDS_A_DAY * i),
      value: firstValue + i
    });
    await value.write(context);
  }

  let values = [];

  for await (const value of meter.values(context)) {
    values.push(value);
  }

  //console.log(values.length, values);
  t.true(values.length >= 100);
  t.deepEqual(
    values[0],
    new LevelValue({ meter, value: firstValue, date: first })
  );

  /*
  values = [];
  for await (const { value, time } of meter.values(master.context, {
    gte: first + SECONDS_A_DAY * 99,
    reverse: true
  })) {
    values.push({ value, time });
  }
  t.log("VALUES", values);

  t.is(values.length, 1);
  t.deepEqual(values[0], { value: lastValue, time: last });
*/

  await master.close();
});

test.skip("readStream", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await LevelMaster.initialize(dbf);

  const c = new LevelCategory(`CAT-1`, master, {
    unit: "kWh",
    fractionalDigits: 2
  });
  await c.write(master.db);

  const first = new Date();
  const firstValue = 77.34;
  let last = first;
  let lastValue = firstValue;

  for (let i = 0; i < 100; i++) {
    last = new Date(first.getTime() + MSECONDS_A_DAY * i);
    lastValue = firstValue + i;
    await c.addValue(master.context, { date: last, value: lastValue });
  }

  const stream = c.readStream(master.context, { reverse: true });

  // stream.pipe(process.stdout);

  const outFileName = tmp.tmpNameSync();
  //console.log(outFileName);
  stream.pipe(createWriteStream(outFileName, { encoding: "utf8" }));

  t.true(stream instanceof Readable);

  await master.close();
});

test.skip("values delete", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await LevelMaster.initialize(dbf);

  const c = new LevelCategory({ name: "CAT-2", unit: "kWh" });
  await c.write(master.context);

  const first = new Date();
  const firstValue = 77.34;
  let last = first;
  let lastValue = firstValue;

  for (let i = 0; i < 3; i++) {
    last = new Date(first.getTime() + MSECONDS_A_DAY * i);
    lastValue = firstValue + i;
    await c.addValue(master.context, { date: last, value: lastValue });
  }
  const ds = await c.getValue(master.db, first);
  t.is((await c.getValue(master.db, first)).toString(), "77.34");
  await c.deleteValue(master.db, first);

  t.is(await c.getValue(master.db, first), undefined);

  await master.close();
});
