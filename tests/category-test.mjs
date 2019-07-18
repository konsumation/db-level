import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";

import { Category } from "../src/category.mjs";

test("categories write / read", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));

  for (let i = 0; i < 10; i++) {
    const c = new Category(`CAT-${i}`, { unit: "kWh" });
    await c.write(db);
  }

  const cs = [];

  for await (const c of Category.entries(db)) {
    cs.push(c);
  }

  t.true(cs.length >= 10);
  t.is(cs[0].unit, "kWh");

  const c = await Category.entry(db,'CAT-7');
  t.is(c.name, "CAT-7");
  t.is(c.unit, "kWh");

  db.close();
});

test("values write / read", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const c = new Category(`CAT-1`, { unit: "kWh" });
  await c.write(db);

  const now = Date.now();
  await c.writeValue(db, 77.34, now);

  const values = [];

  for await (const { value, time } of c.values(db)) {
    values.push({ value, time });
  }
 // console.log("VALUES", values[0]);

  t.true(values.length > 0);
  t.deepEqual(values[0], {value:77.34, time: now});
});
