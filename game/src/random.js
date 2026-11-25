// Sizzle Station — a tiny seeded random generator (mulberry32).
// One job: every die roll in the game comes from here, so a seed replays the
// same shift and the screenshot modes are deterministic.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function rollRange(rng, min, max) {
  return min + rng() * (max - min);
}
