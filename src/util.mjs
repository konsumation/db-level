/**
 * Format seconds as string left padded with '0'
 * @param {number} number seconds since epoch
 * @return {string} padded seconds
 */
export function secondsAsString(number) {
  const s = `000000000000000000${number}`;
  return s.slice(s.length - 15);
}

export function readStreamOptions(key, options = {}) {
  return {
    ...options,
    gte: key + "\u0000",
    lte: key + "\uFFFF"
  };
}

export function readStreamWithTimeOptions(key, options = {}) {
  return {
    ...options,
    gte: key + secondsAsString(options.gte || 0),
    lte: key + secondsAsString(options.lte || 999999999999999)
  };
}

export async function pump(stream, dest) {
  return new Promise((resolve, reject) => {
    const s = stream.pipe(
      dest,
      { end: false }
    );
    stream.on("finish", () => resolve());
    stream.on("end", () => resolve());
    s.on("error", err => reject(err));
  });
}

/**
 * Create properties from options and default options
 * Already present properties (direct) are skipped
 * @see Object.definedProperties()
 * @see Object.hasOwnProperty()
 * @param {Object} object target object
 * @param {Object} options as passed to object constructor
 * @param {Object} properties object properties
 */
export function definePropertiesFromOptions(
  object,
  options = {},
  properties = {}
) {
  const after = {};
  const attributes = object.constructor.attributes;
  if (attributes !== undefined) {
    Object.entries(attributes).forEach(([name, attribute]) => {
      if (properties[name] !== undefined && properties[name].value) {
        return;
      }

      let value = options[name];
      if (value === undefined) {
        value = attribute.default;
      }

      if (value === undefined) {
        return;
      }

      if (attribute.set) {
        value = attribute.set(value);
      } else {
        switch (attribute.type) {
          case "boolean":
            value =
              value === 0 || value === "0" || value === false ? false : true;
            break;
        }
      }

      if (object.hasOwnProperty(name)) {
        after[name] = value;
        return;
      }

      const path = name.split(/\./);
      let key = path[0];

      if (properties[key] === undefined) {
        if (path.length === 1) {
          properties[key] = { value };
          return;
        }
        properties[key] = { value: {} };
      } else {
        if (path.length === 1) {
          after[name] = value;
          return;
        }
      }

      // TODO only 2 levels for now
      properties[key].value[path[1]] = value;
    });
  }

  Object.defineProperties(object, properties);
  Object.assign(object, after);
}

export function getAttribute(object, name) {
  let value = object;

  for (const p of name.split(/\./)) {
    value = value[p];
  }

  return value;
}


/**
 * Create json based on present options.
 * In other words only produce key value pairs if value is defined.
 * @param {Object} object
 * @param {Object} initial
 * @return {Object} initial + defined values
 */
export function optionJSON(object, initial = {}) {
  return Object.keys(object.constructor.attributes).reduce((a, c) => {
    if (object[c] !== undefined) {
      a[c] = object[c];
    }
    return a;
  }, initial);
}
