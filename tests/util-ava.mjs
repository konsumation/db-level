import test from "ava";
import { secondsAsString } from "../src/util.mjs";

function sast(t, value, expected) {
  if (expected === undefined) {
    try {
      secondsAsString(value);
      t.fail();
    } catch (e) {
      t.pass();
    }
  } else {
    t.is(secondsAsString(value), expected);
  }
}

sast.title = (providedTitle = "secondsAsString", value, expected) =>
  `${providedTitle} ${typeof value} ${value} ${
    expected === undefined ? "invalid" : expected
  }`.trim();

test(sast, 1, "000000000000001");
test(sast, 1200, "000000000001200");
test(sast, "0", "000000000000000");
test(sast, "07", "000000000000007");
test(sast, 1.2,  "000000000000001");
