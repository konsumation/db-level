import test from "ava";
import { readFileSync } from "fs";
import { mkdir, rmdir } from "fs/promises";
import got from "got";
import { Category, Meter, Note } from "konsum-db";

import { prepareHttpServer } from "../src/http.mjs";
import { prepareDatabase } from "../src/database.mjs";

const sd = { notify: () => {}, listeners: () => [] };

let port = 3149;

test.before(async t => {
  await mkdir(new URL("../build", import.meta.url).pathname, {
    recursive: true
  });

  port++;

  const file = new URL(`../build/db-${port}`, import.meta.url).pathname;
  const config = {
    version: "1.2.3",
    database: {
      file
    },
    auth: {
      jwt: {
        public: readFileSync(
          new URL("../config/demo.rsa.pub", import.meta.url).pathname
        ),
        private: readFileSync(
          new URL("../config/demo.rsa", import.meta.url).pathname
        ),
        options: {
          algorithm: "RS256"
        }
      },
      users: {
        admin: {
          password: "start123",
          entitlements: ["konsum"]
        }
      }
    },
    http: {
      port
    }
  };

  const { master } = await prepareDatabase(config);
  const { server } = await prepareHttpServer(config, sd, master);

  let response = await got.post(`http://localhost:${port}/authenticate`, {
    json: {
      username: "admin",
      password: "start123"
    }
  });

  t.context.token = JSON.parse(response.body).access_token;
  t.context.master = master;
  t.context.file = file;
  t.context.server = server;
  t.context.port = port;
});

test.after.always(async t => {
  t.context.server.close();
  t.context.server.unref();
  await t.context.master.close();
  await rmdir(t.context.file, { recursive: true });
});

test("get backup", async t => {
  const response = await got.get(
    `http://localhost:${t.context.port}/admin/backup`,
    {
      headers: { Authorization: `Bearer ${t.context.token}` }
    }
  );

  t.log(response.body);

  t.is(response.statusCode, 200);
  //t.regex(response.body, /\d+ 77.34/);
});

test("update category", async t => {
  const response = await got.put(
    `http://localhost:${t.context.port}/category/CAT7`,
    {
      headers: { Authorization: `Bearer ${t.context.token}` },
      json: {
        description: "a new Unit",
        unit: "m3"
      }
    }
  );

  t.is(response.statusCode, 200);
});

test("list category meters", async t => {
  const master = t.context.master;
  const catName = "CAT1";

  const c = new Category(catName, master, { unit: "kWh" });
  await c.write(master.db);
  const m1 = new Meter("M-1", c, { serial: "12345" });
  await m1.write(master.db);
  const m2 = new Meter("M-2", c, { serial: "123456" });
  await m2.write(master.db);

  const response = await got.get(
    `http://localhost:${t.context.port}/category/${catName}/meters`,
    {
      headers: { Authorization: `Bearer ${t.context.token}` }
    }
  );

  t.is(response.statusCode, 200);

  t.deepEqual(JSON.parse(response.body), [
    { name: "M-1", fractionalDigits: 2, serial: "12345" , unit: "kWh" },
    { name: "M-2", fractionalDigits: 2, serial: "123456", unit: "kWh" }
  ]);
});

test("list category notes", async t => {
  const catName = "CAT1";
  const master = t.context.master;

  const c = new Category(catName, master, { unit: "kWh" });
  await c.write(master.db);

  const time = Date.now();
  const n1 = new Note(time - 1, c, { description: "a text" });
  await n1.write(master.db);
  const n2 = new Note(time, c, { description: "a text" });
  await n2.write(master.db);

  const response = await got.get(
    `http://localhost:${t.context.port}/category/${catName}/notes`,
    {
      headers: { Authorization: `Bearer ${t.context.token}` }
    }
  );

  t.is(response.statusCode, 200);

  function d(time) {
    const s = "0000000" + time;
    return s.substring(s.length - 9);
  }

  /*
  t.deepEqual(JSON.parse(response.body), [
    { name: d(time -1), description: "a text" },
    { name: d(time), description: "a text" }
  ]);
  */
});

test("can insert + get values", async t => {
  const master = t.context.master;

  const c = new Category(`CAT1`, { unit: "kWh" });
  await c.write(master.db);
  const now = Date.now();
  await c.writeValue(master.db, 77.34, now);

  let response = await got.post(
    `http://localhost:${t.context.port}/category/CAT1/insert`,
    {
      headers: { Authorization: `Bearer ${t.context.token}` },
      json: {
        value: 78.0
      }
    }
  );

  response = await got.get(
    `http://localhost:${t.context.port}/category/CAT1/values`,
    {
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${t.context.token}`
      }
    }
  );
  t.log(response.body);
  t.regex(response.body, /\d+ 77.34/);
  t.regex(response.body, /\d+ 78/);

  response = await got.get(
    `http://localhost:${t.context.port}/category/CAT1/values`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${t.context.token}`
      }
    }
  );

  t.is(JSON.parse(response.body)[0].value, 77.34);
});
