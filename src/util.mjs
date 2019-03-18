
/**
 * format seconds as string left padded with '0'
 * @param {number} number seconds since epoch
 * @return {string} padded seconds
 */
export function secondsAsString(number) {
  const s = `000000000000000000${number}`;

  return s.substring(s.length - 15);
}
