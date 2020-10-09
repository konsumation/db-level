import test from "ava";
import { secondsAsString } from "../src/util.mjs";
import { Category, Note } from "konsum-db";

test("create Note", async t => {
  const time = Date.now();
  const c = new Category("CAT-1");
  const n1 = new Note(time, c, { description: "some text" });

  t.is(n1.key, "notes.CAT-1." + secondsAsString(time));
  t.is(n1.description, "some text");
});
