import { createWriteStream } from "fs";
import Koa from "koa";
import jsonwebtoken from "jsonwebtoken";
import KoaJWT from "koa-jwt";
import Router from "koa-better-router";
import BodyParser from "koa-bodyparser";
import { Category } from "konsum-db";
import { authenticate } from "./auth.mjs";

export const defaultHttpServerConfig = {
  http: {
    port: "${first(env.PORT,12345)}"
  }
};

function setNoCacheHeaders(ctx) {
  ctx.set("Cache-Control", "no-store, no-cache, must-revalidate");
  ctx.set("Pragma", "no-cache");
  ctx.set("Expires", 0);
}

function isTrue(v) {
  return v && v !== "false" && v != "0";
}

export async function prepareHttpServer(config, sd, master) {
  const app = new Koa();

  const router = Router();

  // middleware to restrict access to token holding requests
  const restricted = KoaJWT({
    secret: config.auth.jwt.public
  });

  function shutdown() {
    sd.notify("STOPPING=1\nSTATUS=stopping");
    server.unref();
  }

  process.on("SIGINT", () => shutdown());

  router.addRoute("POST", "/admin/stop", async (ctx, next) => {
    shutdown();
    ctx.body = "stopping...";
    return next();
  });

  router.addRoute("POST", "/admin/reload", async (ctx, next) => {
    sd.notify("RELOADING=1");
    // TODO
    return next();
  });

  router.addRoute(
    "POST",
    "/admin/backup",
    restricted,
    BodyParser(),
    async (ctx, next) => {
      const q = ctx.request.body;
      const name = q.filename || "/tmp/konsum.txt";

      ctx.body = `backup to ${name}...`;

      master.backup(createWriteStream(name, { encoding: "utf8" }));
      return next();
    }
  );

  router.addRoute("GET", "/admin/backup", restricted, async (ctx, next) => {
    ctx.response.set("content-type", "text/plain");
    ctx.response.set(
      "Content-Disposition",
      'attachment; filename="konsum_backup.txt"'
    );
    ctx.status = 200;
    ctx.respond = false;
    await master.backup(ctx.res);
    ctx.res.end();
    return next();
  });

  router.addRoute("GET", "/state", async (ctx, next) => {
    setNoCacheHeaders(ctx);

    ctx.body = {
      version: config.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    return next();
  });

  /**
   * login to request api token
   */
  router.addRoute("POST", "/authenticate", BodyParser(), async (ctx, next) => {
    const q = ctx.request.body;

    const { entitlements } = await authenticate(config, q.username, q.password);

    if (entitlements.has("konsum")) {
      const claims = {
        entitlements: [...entitlements].join(",")
      };

      const access_token = jsonwebtoken.sign(
        claims,
        config.auth.jwt.private,
        config.auth.jwt.options
      );

      ctx.status = 200;
      ctx.body = {
        access_token
      };
    } else {
      ctx.throw(401, "Authentication failed");
    }
    return next();
  });

  app.use(router.middleware());

  router.addRoute("GET", "/categories", restricted, async (ctx, next) => {
    setNoCacheHeaders(ctx);
    const cs = [];

    for await (const c of Category.entries(master.db)) {
      cs.push(c.toJSON());
    }

    ctx.body = cs;
    return next();
  });

  router.addRoute(
    "PUT",
    "/category/:category",
    restricted,
    BodyParser(),
    async (ctx, next) => {
      const category = new Category(ctx.params.category, master, ctx.request.body);
      await category.write(master.db);
      ctx.body = {};
      return next();
    }
  );

  router.addRoute(
    "GET",
    "/category/:category/values",
    restricted,
    async (ctx, next) => {
      setNoCacheHeaders(ctx);

      const reverse = isTrue(ctx.query.reverse);
      const limit =
        ctx.query.limit === undefined ? -1 : parseInt(ctx.query.limit, 10);
      const options = { reverse, limit };
      const c = await Category.entry(master.db, ctx.params.category);

      switch (ctx.accepts("json", "text")) {
        case "json":
          const it = c.values(master.db, options);

          const values = [];

          for await (const { value, time } of it) {
            values.push({ value, time });
          }

          ctx.body = values;
          break;

        case "text":
          ctx.response.set("content-type", "text/plain");
          ctx.body = c.readStream(master.db, options);
          break;

        default:
          ctx.throw(406, "json, or text only");
      }

      return next();
    }
  );

  router.addRoute(
    "POST",
    "/category/:category/insert",
    restricted,
    BodyParser(),
    async (ctx, next) => {
      const category = await Category.entry(master.db, ctx.params.category);

      const values = ctx.request.body;

      for (const v of Array.isArray(values) ? values : [values]) {
        const time =
          v.time === undefined ? Date.now() : new Date(v.time).valueOf();
        await category.writeValue(master.db, v.value, time / 1000);
      }

      ctx.body = { message: "inserted" };
      return next();
    }
  );

  for (const type of ["meters", "notes"]) {
    router.addRoute(
      "GET",
      `/category/:category/${type}`,
      restricted,
      async (ctx, next) => {
        setNoCacheHeaders(ctx);

        const category = await Category.entry(master.db, ctx.params.category);

        const details = [];

        for await (const detail of category[type](master.db)) {
          details.push(detail.toJSON());
        }

        ctx.body = details;
        return next();
      }
    );

    router.addRoute(
      "PUT",
      `/category/:category/${type}`,
      restricted,
      async (ctx, next) => {
        setNoCacheHeaders(ctx);

        const category = await Category.entry(master.db, ctx.params.category);

        // TODO add type
        //category[type](database);

        ctx.body = {};
        return next();
      }
    );
    router.addRoute(
      "POST",
      `/category/:category/${type}`,
      restricted,
      async (ctx, next) => {
        setNoCacheHeaders(ctx);

        const category = await Category.entry(master.db, ctx.params.category);

        // TODO update type
        //category[type](database);

        ctx.body = {};
        return next();
      }
    );
    router.addRoute(
      "DELETE",
      `/category/:category/${type}`,
      restricted,
      async (ctx, next) => {
        setNoCacheHeaders(ctx);

        const category = await Category.entry(master.db, ctx.params.category);

        // TODO delete type
        //category[type](database);

        ctx.body = {};
        return next();
      }
    );
  }

  const server = app.listen(config.http.port, () => {
    console.log("listen on", server.address());
    sd.notify("READY=1\nSTATUS=running");
  });

  return {
    app,
    server,
    router
  };
}
