// src/logic/generator.ts
import type { Step } from "../types";

/** Counts (UI + tests should align with these) */
export const NORMAL_COUNT = 10;
export const HARD_COUNT = 12;

/** Debug signature so we can verify we’re importing this module */
export const __DEBUG_SIGNATURE = "gen-v3-locked-10-12";

/* ---------- RNG (seeded) ---------- */
function strToSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randint(min: number, max: number, rnd: () => number) {
  return Math.floor(min + rnd() * (max - min + 1));
}
function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

/* ---------- Types ---------- */
type Op = "+" | "-" | "×" | "÷" | "^";
type Candidate = { expr: string; answer: number; op: Op };
type Mode = "normal" | "hard";

/* ---------- Public API ---------- */
export function generateLadder(mode: Mode): Step[] {
  return _generate(mode, Math.random);
}
export function generateLadderForSeed(mode: Mode, seed: string): Step[] {
  const rnd = mulberry32(strToSeed(seed));
  return _generate(mode, rnd);
}

/* ---------- Core generator ---------- */
function _generate(mode: Mode, rnd: () => number): Step[] {
  const want = mode === "normal" ? NORMAL_COUNT : HARD_COUNT;
  const requiredOps: Op[] =
    mode === "normal" ? ["+", "-", "×", "÷"] : ["+", "-", "×", "÷", "^"];

  // Build large pool then enforce coverage + dedup
  const pool: Candidate[] = [];
  const seen = new Set<string>();
  const POOL_TARGET = 80;
  let guard = 0;

  while (pool.length < POOL_TARGET && guard++ < 2500) {
    const c =
      mode === "normal" ? makeNormalCandidate(rnd) : makeHardCandidate(rnd);
    if (!Number.isFinite(c.answer)) continue;
    if (seen.has(c.expr)) continue;
    if (Math.abs(c.answer) > 999) continue;
    seen.add(c.expr);
    pool.push(c);
  }

  // coverage first
  const picked: Candidate[] = [];
  const used = new Set<string>();
  for (const need of requiredOps) {
    const hit = pool.find((c) => c.op === need && !used.has(c.expr));
    if (hit) {
      picked.push(hit);
      used.add(hit.expr);
    }
  }

  // weighted fill
  const weight = (c: Candidate) =>
    mode === "normal"
      ? c.op === "×" || c.op === "÷"
        ? 3
        : 1
      : c.op === "^"
      ? 4
      : c.op === "÷"
      ? 2
      : 1;

  while (picked.length < want) {
    const remaining = pool.filter((c) => !used.has(c.expr));
    if (!remaining.length) break;
    const total = remaining.reduce((s, x) => s + weight(x), 0);
    let r = rnd() * total;
    let choice = remaining[0];
    for (const x of remaining) {
      r -= weight(x);
      if (r <= 0) {
        choice = x;
        break;
      }
    }
    picked.push(choice);
    used.add(choice.expr);
  }

  // shuffle
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked.slice(0, want).map<Step>((c) => ({ prompt: c.expr, answer: c.answer }));
}

/* ---------- NORMAL (10) ---------- */
function makeNormalCandidate(rnd: () => number): Candidate {
  const op = pick<Op>(["+", "-", "×", "÷"], rnd);
  let a = randint(2, 99, rnd);
  let b = randint(2, 99, rnd);

  if (op === "÷") {
    b = randint(3, 18, rnd);
    const k = randint(3, 18, rnd);
    a = b * k; // integer
    return { expr: `${a} ÷ ${b}`, answer: a / b, op };
  }
  if (op === "×") {
    a = randint(6, 25, rnd);
    b = randint(6, 25, rnd);
    return { expr: `${a} × ${b}`, answer: a * b, op };
  }
  if (op === "+") {
    return { expr: `${a} + ${b}`, answer: a + b, op };
  }
  return { expr: `${a} - ${b}`, answer: a - b, op }; // allow negatives
}

/* ---------- HARD (12) ---------- */
function makeHardCandidate(rnd: () => number): Candidate {
  const r = rnd();

  if (r < 0.4) {
    // (a ± b) ×/÷ c
    const add = rnd() < 0.5;
    const mul = rnd() < 0.6;
    let a = randint(5, 60, rnd);
    let b = randint(3, 40, rnd);
    let inner = add ? a + b : a - b;

    if (mul) {
      const c = randint(3, 15, rnd);
      return { expr: `(${a} ${add ? "+" : "-"} ${b}) × ${c}`, answer: inner * c, op: "×" };
    } else {
      if (inner === 0) inner = randint(6, 30, rnd);
      const factors = divisors(Math.abs(inner)).filter((x) => x > 1 && x <= 20);
      const c = factors.length ? pick(factors, rnd) : 2;
      return { expr: `(${a} ${add ? "+" : "-"} ${b}) ÷ ${c}`, answer: inner / c, op: "÷" };
    }
  }

  if (r < 0.75) {
    // (a × b) ÷ c  OR  (a ÷ b) × c  with integer results
    const prodFirst = rnd() < 0.5;
    if (prodFirst) {
      const a = randint(6, 20, rnd);
      const b = randint(6, 20, rnd);
      const p = a * b;
      const fs = divisors(p).filter((x) => x > 2 && x <= 30);
      const c = fs.length ? pick(fs, rnd) : 2;
      return { expr: `(${a} × ${b}) ÷ ${c}`, answer: p / c, op: "÷" };
    } else {
      let b = randint(3, 12, rnd);
      const k = randint(2, 12, rnd);
      const a = b * k;
      const c = randint(3, 15, rnd);
      return { expr: `(${a} ÷ ${b}) × ${c}`, answer: (a / b) * c, op: "×" };
    }
  }

  // exponent mix (ensures ^ appears in the pool)
  if (rnd() < 0.6) {
    const base = randint(3, 9, rnd);
    const e = pick([2, 3], rnd);
    const pow = intPow(base, e);
    const b = randint(5, 60, rnd);
    const add = rnd() < 0.5;
    return { expr: `${base} ^ ${e} ${add ? "+" : "-"} ${b}`, answer: add ? pow + b : pow - b, op: "^" };
  } else {
    const a = randint(6, 18, rnd);
    const b = randint(2, 10, rnd);
    const add = rnd() < 0.5;
    const inner = add ? a + b : a - b;
    const pow = intPow(inner, 2);
    return { expr: `(${a} ${add ? "+" : "-"} ${b}) ^ 2`, answer: pow, op: "^" };
  }
}

/* ---------- helpers ---------- */
function divisors(n: number): number[] {
  const out: number[] = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) {
      out.push(i);
      if (i * i !== n) out.push(n / i);
    }
  }
  return out.sort((a, b) => a - b);
}
function intPow(base: number, exp: number): number {
  let r = 1;
  for (let i = 0; i < exp; i++) r *= base;
  return r;
}
