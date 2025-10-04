import { describe, it, expect } from "vitest";
import { generateLadderForSeed } from "../logic/generator";

// Define expected counts here (no import of constants)
const NORMAL_COUNT = 10;
const HARD_COUNT = 12;

/**
 * Seeds used for determinism.
 * We pass the seed string and the mode separately to the generator.
 */
const SEEDS = {
  normal: "2025-08-29-normal",
  hard: "2025-08-29-hard",
};

/** Helpers */
function opsInPrompt(p: string): Set<string> {
  const s = new Set<string>();
  if (p.includes("×")) s.add("×");
  if (p.includes("÷")) s.add("÷");
  if (p.includes(" + ")) s.add("+");
  if (p.includes(" - ")) s.add("-");
  if (p.includes("^")) s.add("^");
  return s;
}

function anyDivisionIsInteger(steps: { prompt: string; answer: number }[]) {
  for (const s of steps) {
    if (s.prompt.includes("÷") && !Number.isInteger(s.answer)) {
      return false;
    }
  }
  return true;
}

describe("generator (normal)", () => {
  it("has the expected number of unique rungs", () => {
    const steps = generateLadderForSeed("normal", SEEDS.normal);
    expect(steps).toHaveLength(NORMAL_COUNT);
    const uniq = new Set(steps.map((s) => s.prompt));
    expect(uniq.size).toBe(NORMAL_COUNT);
  });

  it("covers a mix of +, -, ×, ÷ (≥3 ops, usually 4)", () => {
    const steps = generateLadderForSeed("normal", SEEDS.normal);
    const ops = new Set<string>();
    for (const s of steps) {
      const o = opsInPrompt(s.prompt);
      o.forEach((ch) => ops.add(ch));
    }
    expect(ops.has("^")).toBe(false); // no ^ in normal
    expect(ops.size).toBeGreaterThanOrEqual(3);
  });

  it("keeps head-math-friendly answer magnitudes", () => {
    const steps = generateLadderForSeed("normal", SEEDS.normal);
    for (const s of steps) {
      expect(Math.abs(s.answer)).toBeLessThanOrEqual(999);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateLadderForSeed("normal", SEEDS.normal);
    const b = generateLadderForSeed("normal", SEEDS.normal);
    expect(a.map((x) => x.prompt)).toEqual(b.map((x) => x.prompt));
  });
});

describe("generator (hard)", () => {
  it("has the expected number of unique rungs", () => {
    const steps = generateLadderForSeed("hard", SEEDS.hard);
    expect(steps).toHaveLength(HARD_COUNT);
    const uniq = new Set(steps.map((s) => s.prompt));
    expect(uniq.size).toBe(HARD_COUNT);
  });

  it("includes exponent ^ at least once", () => {
    const steps = generateLadderForSeed("hard", SEEDS.hard);
    expect(steps.some((s) => s.prompt.includes("^"))).toBe(true);
  });

  it("keeps head-math-friendly answer magnitudes", () => {
    const steps = generateLadderForSeed("hard", SEEDS.hard);
    for (const s of steps) {
      expect(Math.abs(s.answer)).toBeLessThanOrEqual(999);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateLadderForSeed("hard", SEEDS.hard);
    const b = generateLadderForSeed("hard", SEEDS.hard);
    expect(a.map((x) => x.prompt)).toEqual(b.map((x) => x.prompt));
  });
});

describe("shared properties", () => {
  it("any division yields an integer answer (normal + hard)", () => {
    const n = generateLadderForSeed("normal", SEEDS.normal);
    const h = generateLadderForSeed("hard", SEEDS.hard);
    expect(anyDivisionIsInteger(n)).toBe(true);
    expect(anyDivisionIsInteger(h)).toBe(true);
  });
});
