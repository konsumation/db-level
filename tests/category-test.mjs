import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { Readable } from "stream";
import { createWriteStream } from "fs";
import { Master, Category } from "konsum-db";

test("Category key", t => t.is(new Category("name1").key, "categories.name1"));

test("Category write / read", async t => {
  const master = await Master.initialize(await levelup(leveldown(tmp.tmpNameSync())));

  for (let i = 0; i < 10; i++) {
    const c = new Category(`CAT-${i}`, master, { unit: "kWh", fractionalDigits: 3 });
    await c.write(master.db);
  }

  const cs = [];

  for await (const c of Category.entries(master.db)) {
    cs.push(c);
  }

  t.true(cs.length >= 10);
  t.is(cs[0].unit, "kWh");
  t.is(cs[0].fractionalDigits, 3);

  const c = await Category.entry(master.db, "CAT-7");
  t.is(c.name, "CAT-7");
  t.is(c.unit, "kWh");
  t.is(c.fractionalDigits, 3);

  master.close();
});

const SECONDS_A_DAY = 60 * 60 * 24;

test("values write / read", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await Master.initialize(await levelup(leveldown(dbf)));

  const c = new Category(`CAT-1`, master, { unit: "kWh" });
  await c.write(master.db);

  const first = Date.now();
  const firstValue = 77.34;
  let last = first;
  let lastValue = firstValue;

  for (let i = 0; i < 100; i++) {
    last = new Date(first + SECONDS_A_DAY * i).getTime();
    lastValue = firstValue + i;
    await c.writeValue(master.db, lastValue, last);
  }

  let values = [];

  for await (const { value, time } of c.values(master.db)) {
    values.push({ value, time });
  }

  t.true(values.length >= 100);
  t.deepEqual(values[0], { value: firstValue, time: first });

  values = [];
  for await (const { value, time } of c.values(master.db, {
    gte: first + SECONDS_A_DAY * 99,
    reverse: true
  })) {
    values.push({ value, time });
  }
  //t.log("VALUES", values);

  t.is(values.length, 1);
  t.deepEqual(values[0], { value: lastValue, time: last });

  master.close();
});

test("readStream", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await Master.initialize(await levelup(leveldown(dbf)));

  const c = new Category(`CAT-1`, master, { unit: "kWh", fractionalDigits: 2 });
  await c.write(master.db);

  const first = Date.now();
  const firstValue = 77.34;
  let last = first;
  let lastValue = firstValue;

  for (let i = 0; i < 100; i++) {
    last = new Date(first + SECONDS_A_DAY * i).getTime();
    lastValue = firstValue + i;
    await c.writeValue(master.db, lastValue, last);
  }

  const stream = c.readStream(master.db, { reverse: true });

  // stream.pipe(process.stdout);

  const outFileName = tmp.tmpNameSync();
  //console.log(outFileName);
  stream.pipe(createWriteStream(outFileName, { encoding: "utf8" }));

  t.true(stream instanceof Readable);


  master.close();
});
