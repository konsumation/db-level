import test from "ava";
import { Base } from "../src/base.mjs";


test("Base name", t => t.is(new Base("name1").name, "name1"));
test("Base invalid name", t =>
  t.throws(() => new Base("a.a.a"), { message: /only letters digits/ }));

test("Base string", t => t.is(`${new Base("name1")}`, "name1:"));
