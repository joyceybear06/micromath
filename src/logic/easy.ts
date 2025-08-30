import type { Step } from "../types";

/** Easy mode: 8 whole-number problems using + − × ÷ only. */
export const EASY_COUNT = 8;

/* ---------- small deterministic RNG for Daily ---------- */
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rngFromSeed(seed: string) {
  let x = hashSeed(seed) || 0x9e3779b9;
  return () => {
    // xorshift32
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}
function randInt(r: () => number, min: number, max: number) {
  return Math.floor(r() * (max - min + 1)) + min;
}
function choice<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

/* ---------- problem builders (whole numbers) ---------- */
function buildAdd(r: () => number): Step {
  const a = randInt(r, 2, 99);
  const b = randInt(r, 2, 99);
  return { prompt: `${a} + ${b}`, answer: a + b };
}
function buildSub(r: () => number): Step {
  const a = randInt(r, 2, 99);
  const b = randInt(r, 1, a); // ensure non-negative result
  return { prompt: `${a} − ${b}`, answer: a - b };
}
function buildMul(r: () => number): Step {
  const a = randInt(r, 2, 12);
  const b = randInt(r, 2, 12);
  return { prompt: `${a} × ${b}`, answer: a * b };
}
function buildDiv(r: () => number): Step {
  const b = randInt(r, 2, 12);
  const q = randInt(r, 1, 12);
  const a = b * q; // exact division
  return { prompt: `${a} ÷ ${b}`, answer: q };
}

function generateEasyWithRng(r: () => number): Step[] {
  const builders = [buildAdd, buildSub, buildMul, buildDiv];
  const out: Step[] = [];
  for (let i = 0; i < EASY_COUNT; i++) {
    const make = choice(r, builders);
    out.push(make(r));
  }
  return out;
}

/* ---------- public API ---------- */
export function generateEasy(): Step[] {
  const r = Math.random.bind(Math);
  return generateEasyWithRng(r);
}
export function generateEasyForSeed(seed: string): Step[] {
  const r = rngFromSeed(seed);
  return generateEasyWithRng(r);
}
