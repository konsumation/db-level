import test from "ava";
import { Base } from "../src/base.mjs";

test("Base typeName", t => t.is(Base.typeName, "base"));
test("Base instance typeName", t => t.is(new Base("b1").typeName, "base"));
test("Base keyPrefix", t => t.is(Base.keyPrefix, "bases."));
test("Base instance keyPrefix", t => t.is(new Base("b1").keyPrefix, "bases."));

test("Base name", t => t.is(new Base("name1").name, "name1"));
test("Base key", t => t.is(new Base("name1").key, "bases.name1"));
