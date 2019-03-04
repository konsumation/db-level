export function secondsAsString(number) {
  const s = `000000000000000000${number}`;

  return s.substring(s.length - 15);
}
