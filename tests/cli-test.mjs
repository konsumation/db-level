import test from "ava";
import execa from "execa";

test("cli version", async t => {
  const p = await execa(
    new URL("../src/konsum-cli.mjs", import.meta.url).pathname,
    ["--config", new URL("../config", import.meta.url).pathname, "--version"],
    { cwd: new URL("../build", import.meta.url).pathname }
  );

  t.regex(p.stdout, /\d+/);
});
