import test from "ava";
import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";
import tmp from "tmp";
import { testCategoryConstructor } from "@konsumation/db-test";
import { Master, Category } from "@konsumation/db-level";
import { CATEGORY_PREFIX } from "../src/consts.mjs";


test("Category typeName", t => t.is(Category.typeName, "category"));
test("Category instance typeName", t => t.is(new Category("c1").typeName, "category"));

test("Category keyPrefix", t => t.is(Category.keyPrefix, CATEGORY_PREFIX));
test("Category instance keyPrefix", t => t.is(new Category("c1").keyPrefix, CATEGORY_PREFIX));

test("Category key", t => t.is(new Category("name1").key, "categories.name1"));
test.skip("Category constructor", t => testCategoryConstructor(t, Category));

test("Category value time 0", t =>
  t.is(new Category("cat").valueKey(0), "values.cat.000000000000000"));

test("Category write / read / delete", async t => {
  const master = await Master.initialize(tmp.tmpNameSync());

  for (let i = 0; i < 10; i++) {
    const c = new Category(`CAT-${i}`, master, {
      unit: "kWh",
      fractionalDigits: 3
    });
    await c.write(master.db);
  }

  const cs = [];

  for await (const c of master.categories()) {
    cs.push(c);
  }

  t.true(cs.length >= 10);
  t.is(cs[0].unit, "kWh");
  t.is(cs[0].fractionalDigits, 3);

  let c = await Category.entry(master.db, "CAT-7");
  t.is(c.name, "CAT-7");
  t.is(c.unit, "kWh");
  t.is(c.fractionalDigits, 3);

  c = await Category.entry(master.db, "CAT-12");
  //t.falsy(c);

  await c.delete(master.db);

  // await master.backup(createWriteStream('/tmp/x.txt',{ encoding: "utf8" }));

  c = await Category.entry(master.db, "CAT-7");
  //t.falsy(c);

  await master.close();
});

const SECONDS_A_DAY = 60 * 60 * 24;

test("values write / read", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await Master.initialize(dbf);

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
  t.log("VALUES", values);

  t.is(values.length, 1);
  t.deepEqual(values[0], { value: lastValue, time: last });

  await master.close();
});

test("values delete", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await Master.initialize(dbf);

  const c = new Category(`CAT-2`, master, { unit: "kWh" });
  await c.write(master.db);

  const first = Date.now();
  const firstValue = 77.34;
  let last = first;
  let lastValue = firstValue;

  for (let i = 0; i < 3; i++) {
    last = new Date(first + SECONDS_A_DAY * i).getTime();
    lastValue = firstValue + i;
    await c.writeValue(master.db, lastValue, last);
  }
  const ds = await c.getValue(master.db, first);
  t.is((await c.getValue(master.db, first)).toString(), "77.34");
  await c.deleteValue(master.db, first);

  t.is(await c.getValue(master.db, first), undefined);

  await master.close();
});

test("readStream", async t => {
  const dbf = tmp.tmpNameSync();
  const master = await Master.initialize(dbf);

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

  //master.close();
});
