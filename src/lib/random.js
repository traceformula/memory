// Unbiased randomness from the browser's crypto source, so drills can't fall into patterns.

export function randInt(n) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  let x;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % n;
}

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomDigits(count, base = 10) {
  let s = "";
  for (let i = 0; i < count; i++) s += randInt(base);
  return s;
}

export const uid = () => crypto.randomUUID();
