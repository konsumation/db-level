import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { Readable } from "stream";
import { createWriteStream } from "fs";

import { Category, Meter } from "konsum-db";

test("create Meter", async t => {
  const c = new Category("CAT-1", { unit: "kWh", fractionalDigits: 3 });
  const m1 = new Meter("M1", c);
  
  t.is(m1.name, 'M1');
  t.is(m1.unit, 'kWh');
});
