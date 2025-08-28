// src/utils/rand.ts
/** Basic random helpers (non-seeded) */
export const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const choice = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const randomFactorOf = (n: number): number => {
  const factors: number[] = [];
  const limit = Math.abs(n);
  for (let i = 1; i <= limit; i++) if (limit % i === 0) factors.push(i);
  const f = choice(factors);
  return n < 0 && Math.random() < 0.5 ? -f : f;
};

/** ---------- Seeded RNG (deterministic) ---------- */
function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Make a seeded RNG in [0,1) from any string */
export const makeSeededRng = (seedStr: string): (() => number) => {
  const seed = xmur3(seedStr);
  return sfc32(seed(), seed(), seed(), seed());
};

/** Seeded helpers */
export const sRandInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

export const sChoice = <T,>(rng: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)];

export const sRandomFactorOf = (rng: () => number, n: number): number => {
  const factors: number[] = [];
  const limit = Math.abs(n);
  for (let i = 1; i <= limit; i++) if (limit % i === 0) factors.push(i);
  const f = sChoice(rng, factors);
  return n < 0 && rng() < 0.5 ? -f : f;
};
