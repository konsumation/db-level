/**
 * Format seconds as string left padded with '0'.
 * @param {number} seconds seconds since epoch
 * @return {string} padded seconds
 */
export function secondsAsString(seconds) {
  if (typeof seconds === "string") {
    seconds = parseFloat(seconds);
  }
  seconds = Math.floor(seconds);

  const s = `000000000000000000${seconds}`;
  return s.slice(s.length - 15);
}

export function readStreamOptions(key, options) {
  return {
    ...options,
    gte: key + "\u0000",
    lte: key + "\uFFFF"
  };
}

export function readStreamWithTimeOptions(key, options) {
  return {
    ...options,
    gte: key + secondsAsString(options?.gte || 0),
    lte: key + secondsAsString(options?.lte || 999999999999999)
  };
}
