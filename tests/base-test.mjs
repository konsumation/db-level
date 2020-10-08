import test from "ava";
import { Base } from "../src/base.mjs";

test("Base typeName", t => t.is(Base.typeName, "base"));
test("Base keyPrefix", t => t.is(Base.keyPrefix, "bases."));
