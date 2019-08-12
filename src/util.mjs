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
