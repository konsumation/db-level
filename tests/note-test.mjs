import test from "ava";
import tmp from "tmp";
import levelup from "levelup";
import leveldown from "leveldown";
import { secondsAsString } from "../src/util.mjs";
import { Category, Note } from "konsum-db";

test("create Note", async t => {
  const time = Date.now();
  const database = {};

  const c = new Category("CAT-1", database);
  const n1 = new Note(time, c, { description: "some text" });

  t.is(n1.keyPrefix, "notes.CAT-1.");
  t.is(n1.key, "notes.CAT-1." + secondsAsString(time));
  t.is(n1.description, "some text");
});

test("Note write / read", async t => {
  const db = await levelup(leveldown(tmp.tmpNameSync()));
  const database = {};

  const c = new Category("CAT-1", database, { unit: "kWh", fractionalDigits: 3 });
  await c.write(db);

  const time = Date.now();

  for (let i = 0; i < 5; i++) {
    const n = new Note(time + i, c, { description: `description ${i}` });
    await n.write(db);
  }

  const ms = [];

  for await (const m of Note.entriesWith(db, c)) {
    ms.push(m);
  }

  t.true(ms.length >= 5);
  t.is(ms[0].description, "description 0");

  db.close();
});
