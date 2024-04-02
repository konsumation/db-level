import test from "ava";
import tmp from "tmp";
import {
  testCategoryConstructor,
  testCreateCategories
} from "@konsumation/db-test";
import { LevelMaster, LevelCategory } from "@konsumation/db-level";
import { CATEGORY_PREFIX } from "../src/consts.mjs";

test("Category keyPrefix", t => t.is(LevelCategory.keyPrefix, CATEGORY_PREFIX));
test("Category instance keyPrefix", t =>
  t.is(new LevelCategory("c1").keyPrefix, CATEGORY_PREFIX));

test("Category key", t =>
  t.is(new LevelCategory({ name: "name1" }).key, "categories.name1"));
test("Category constructor", t => testCategoryConstructor(t, LevelCategory));

test("Category write / read / delete", async t => {
  const master = await LevelMaster.initialize(tmp.tmpNameSync());

  const categories = await testCreateCategories(
    t,
    master,
    Array.from({ length: 10 }, (_, i) => `CAT-${i}`),
    { fractionalDigits: 3, unit: "kWh" }
    // (t, category) => console.log(category)
  );

  t.true(categories.length >= 10);
  t.is(categories[0].unit, "kWh");
  t.is(categories[0].fractionalDigits, 3);

  let category = await LevelCategory.entry(master.context, "CAT-7");
  
  t.is(category.name, "CAT-7");
  t.is(category.unit, "kWh");
  t.is(category.fractionalDigits, 3);


  category = await LevelCategory.entry(master.context, "CAT-12");
  await category.delete(master.context);

  for await(const line of master.text(master.context)) {
    console.log(line);
  }

  //c = await LevelCategory.entry(master.context, "CAT-7");
  //t.falsy(c);

  await master.close();
});
