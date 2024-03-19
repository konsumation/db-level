#!/usr/bin/env node

import { ClassicLevel } from "classic-level";
import { Master, VALUE_PREFIX, secondsAsString } from "konsum-db";

/**
 * remove fractional seconds from key
 */
async function execute() {
  const master = await Master.initialize(new ClassicLevel(tmp.tmpNameSync()));
  const db = master.db;

  for await (const data of db.createReadStream({
    gte :  VALUE_PREFIX + "\u0000", lte : VALUE_PREFIX + "\uFFFF"

  })) {
   // console.log(data.key.toString(), data.value.toString());

    let key = data.key.toString();

    const m = key.match(/(\w+\.\w+\.)(\d+\.\d+)/);
    if(m) {
      let nKey = m[1] + secondsAsString(Math.round(parseFloat(m[2])));

      console.log(data.key.toString(), nKey, data.value.toString());

      await db.put(nKey, data.value);
      await db.del(key);
    }
  }
}

execute();
