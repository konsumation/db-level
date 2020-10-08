import test from "ava";
import { Base } from "../src/base.mjs";

test("Base typeName", t => t.is(Base.typeName, "base"));
test("Base instance typeName", t => t.is(new Base().typeName, "base"));
test("Base keyPrefix", t => t.is(Base.keyPrefix, "bases."));
test("Base instance keyPrefix", t => t.is(new Base().keyPrefix, "bases."));
