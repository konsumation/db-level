import test from "ava";
import { Base } from "../src/base.mjs";

test("Base keyPrefix", t => t.is(Base.keyPrefix, "bases."));
test("Base instance keyPrefix", t => t.is(new Base("b1").keyPrefix, "bases."));

test("Base name", t => t.is(new Base("name1").name, "name1"));
test("Base invalid name", t =>
  t.throws(() => new Base("a.a.a"), { message: /only letters digits/ }));

test("Base key", t => t.is(new Base("name1").key, "bases.name1"));
test("Base json", t =>
  t.deepEqual(JSON.parse(JSON.stringify(new Base("name1"))), {
    name: "name1"
  }));
test("Base string", t => t.is(`${new Base("name1")}`, "name1:"));
