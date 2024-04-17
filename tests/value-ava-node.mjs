import test from "ava";
import { LevelCategory, LevelMeter, LevelValue } from "@konsumation/db-level";

test("LevelValue value time 0", t =>
  t.is(
    new LevelValue({
      meter: new LevelMeter({
        name: "M-1",
        category: new LevelCategory({ name: "CAT-1" })
      }),
      date: new Date(0)
    }).key,
    "values.M-1.000000000000000"
  ));
