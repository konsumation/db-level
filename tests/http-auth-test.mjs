import test from "ava";
import { readFileSync } from "fs";
import { mkdir } from "fs/promises";
import got from "got";

import { prepareHttpServer } from "../src/http.mjs";

const sd = { notify: () => {}, listeners: () => [] };

let port = 3169;

test.before(async t => {
  await mkdir(new URL("../build", import.meta.url).pathname, { recursive: true });

  port++;

  const config = {
    version: "1.2.3",
    database: {
      file: new URL(`../build/db-${port}`, import.meta.url).pathname
    },
    auth: {
      jwt: {
        public: readFileSync(new URL("../config/demo.rsa.pub", import.meta.url).pathname),
        private: readFileSync(new URL("../config/demo.rsa", import.meta.url).pathname),
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

  const { server } = await prepareHttpServer(config, sd);

  let response = await got.post(`http://localhost:${port}/authenticate`, {
    json: {
      username: "admin",
      password: "start123"
    }
  });

  t.context.token = JSON.parse(response.body).access_token;
  t.context.server = server;
  t.context.port = port;
});

test.after.always(async t => {
  t.context.server.close();
  t.context.server.unref();
});

test("server can authenticate", async t => {
  const response = await got.post(
    `http://localhost:${t.context.port}/authenticate`,
    {
      json: {
        username: "admin",
        password: "start123"
      }
    }
  );

  t.is(response.statusCode, 200);
  t.truthy(JSON.parse(response.body).access_token.length > 10);
});

test("fails with invalid credentials", async t => {
  try {
    const response = await got.post(
      `http://localhost:${t.context.port}/authenticate`,
      {
        json: {
          username: "admin",
          password: "wrong"
        }
      }
    );
  } catch (error) {
    t.is(error.response.statusCode, 401);
  }
});
