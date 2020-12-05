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
