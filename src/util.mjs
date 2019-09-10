/**
 * format seconds as string left padded with '0'
 * @param {number} number seconds since epoch
 * @return {string} padded seconds
 */
export function secondsAsString(number) {
  const s = `000000000000000000${number}`;

  return s.substring(s.length - 15);
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
 * create properties from options and default options
 * @see Object.definedProperties()
 * @param {Object} object target object
 * @param {Object} options as passed to object constructor
 * @param {Object} properties object properties
 */
export function definePropertiesFromOptions(object, options, properties = {}) {
  const defaultOptions = object.constructor.defaultOptions;
  const after = {};

  Object.keys(defaultOptions).forEach(name => {
    const value =
      (options !== undefined && options[name]) || defaultOptions[name];

    if (properties[name] === undefined) {
      properties[name] = { value };
    } else {
      after[name] = value;
    }
  });

  Object.defineProperties(object, properties);
  Object.assign(object, after);
}

/**
 * create json based on present options.
 * In other words only produce key value pairs if value is defined.
 * @param {Object} object
 * @param {Object} initial
 * @return {Object} initial + defined values
 */
export function optionJSON(object, initial = {}) {
  return Object.keys(object.constructor.defaultOptions).reduce((a, c) => {
    if (object[c] !== undefined) {
      a[c] = object[c];
    }
    return a;
  }, initial);
}
