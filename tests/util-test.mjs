import test from "ava";
import { secondsAsString } from "../src/util.mjs";

test("secondsAsString", t => {
  t.is(secondsAsString(1), "000000000000001");
  t.is(secondsAsString(1200), "000000000001200");
});
