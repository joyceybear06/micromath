import { rngFromSeed } from "./rng";

export type Rung = { expr: string; answer: number; op: "+" | "-" | "x" | "÷" };
export type Difficulty = "easy" | "normal" | "hard";

type Range = { min: number; max: number };

const ranges: Record<Difficulty, Range> = {
  easy:   { min: 2,  max: 25 },
  normal: { min: 1,  max: 50 },
  hard:   { min: 1,  max: 100 },
};

function randint(r: Range, rnd: () => number) {
  return Math.floor(r.min + rnd() * (r.max - r.min + 1));
}

function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

function genRungForOp(op: Rung["op"], r: Range, rnd: () => number) {
  let a = randint(r, rnd);
  let b = randint(r, rnd);

  if (op === "÷") {
    b = Math.max(1, b);
    const k = randint({ min: 1, max: 10 }, rnd);
    a = b * k; // integer division
  }

  if (op === "-" && a < b) [a, b] = [b, a]; // non-negative subtraction

  let expr = "";
  let answer = 0;
  if (op === "+") { answer = a + b; expr = `${a} + ${b}`; }
  else if (op === "-") { answer = a - b; expr = `${a} - ${b}`; }
  else if (op === "x") { answer = a * b; expr = `${a} × ${b}`; }
  else { answer = a / b; expr = `${a} ÷ ${b}`; }

  return { expr, answer, op } as Rung;
}

export function generateDay(date: Date, diff: Difficulty = "normal", length = 10) {
  const seed =
    date.getFullYear() * 10000 +
    (date.getMonth() + 1) * 100 +
    date.getDate();
  const rnd = rngFromSeed(seed);
  const r = ranges[diff];

  const pool: Array<Rung["op"]> =
    diff === "easy"
      ? ["+", "+", "-", "-", "x", "x"] // weighted, no ÷
      : ["+", "-", "x", "÷"];

  const seen = new Set<string>();
  const rungs: Rung[] = [];
  const MAX_ATTEMPTS = 2000;
  let attempts = 0;

  const pushUnique = (rg: Rung) => {
    if (seen.has(rg.expr)) return false;
    seen.add(rg.expr);
    rungs.push(rg);
    return true;
  };

  // ✅ Guarantee op coverage for normal + hard
  const mustOps: Rung["op"][] =
    diff === "easy" ? [] : ["+", "-", "x", "÷"];

  for (const op of mustOps) {
    let placed = false;
    for (let i = 0; i < 200 && !placed; i++) {
      attempts++;
      placed = pushUnique(genRungForOp(op, r, rnd));
    }
  }

  while (rungs.length < length && attempts < MAX_ATTEMPTS) {
    attempts++;
    const op = pick(pool, rnd);
    pushUnique(genRungForOp(op, r, rnd));
  }

  while (rungs.length < length && attempts < MAX_ATTEMPTS) {
    attempts++;
    pushUnique(genRungForOp("+", r, rnd));
  }

  return {
    date: date.toISOString().slice(0, 10),
    difficulty: diff,
    rungs,
  };
}
