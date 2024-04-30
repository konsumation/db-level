import test from "ava";
import tmp from "tmp";
import { secondsAsString } from "../src/util.mjs";
import {
  LevelMaster,
  LevelCategory,
  LevelMeter,
  LevelNote
} from "@konsumation/db-level";

test("create Note", async t => {
  const time = new Date();

  const category = new LevelCategory({ name: "CAT-1" });
  const meter = new LevelMeter({
    name: "M-1",
    category,
    description: "some text"
  });
  const note = new LevelNote({ name: time, meter, description: "some text" });

 // t.is(note.keyPrefix, "notes.CAT-1.");
 // t.is(note.key, "notes.CAT-1." + secondsAsString(time.getTime()));
  t.is(note.description, "some text");
});

test.skip("Note write / read", async t => {
  const master = await LevelMaster.initialize(tmp.tmpNameSync());
  const context = master.context;

  const category = new LevelCategory({
    name: "CAT-1",
    unit: "kWh",
    fractionalDigits: 3
  });
  await category.write(context);
  const meter = new LevelMeter({
    category,
    name: "M-1",
    category,
    description: "some text"
  });
  await meter.write(master.context);

  const time = new Date();

  for (let i = 0; i < 5; i++) {
    const note = new LevelNote({
      meter,
      name: new Date(time.getTime() + i),
      description: `description ${i}`
    });
    await note.write(master.context);
  }

  const ms = [];

  for await (const m of meter.notes(context)) {
    console.log(m);
    ms.push(m);
  }


  t.true(ms.length >= 5);
  t.is(ms[0].description, "description 0");

  master.close();
});
