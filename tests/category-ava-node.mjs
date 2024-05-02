import test from "ava";
import tmp from "tmp";
import {
  testCategoryConstructor,
  testWriteReadUpdateDeleteCategories
} from "@konsumation/db-test";
import { LevelMaster, LevelCategory } from "@konsumation/db-level";
import { CATEGORY_PREFIX } from "../src/consts.mjs";

test("Category keyPrefix", t => t.is(LevelCategory.keyPrefix, CATEGORY_PREFIX));

test("Category key", t =>
  t.is(new LevelCategory({ name: "name1" }).key, "categories.name1"));
test("Category constructor", t => testCategoryConstructor(t, LevelCategory));

test("Category write / read / update / delete", async t =>
  testWriteReadUpdateDeleteCategories(
    t,
    await LevelMaster.initialize(tmp.tmpNameSync())
  ));
