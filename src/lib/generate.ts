import { rngFromSeed } from "./rng";

export type Rung = { expr: string; answer: number; op: "+" | "-" | "x" | "÷" };
export type Difficulty = "easy" | "normal";

type Range = { min: number; max: number };

const ranges: Record<Difficulty, Range> = {
  easy: { min: 1, max: 20 },
  normal: { min: 1, max: 50 },
};

function randint(r: Range, rnd: () => number) {
  return Math.floor(r.min + rnd() * (r.max - r.min + 1));
}

function pick<T>(arr: T[], rnd: () => number) {
  return arr[Math.floor(rnd() * arr.length)];
}

export function generateDay(date: Date, diff: Difficulty = "normal") {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const rnd = rngFromSeed(seed);
  const r = ranges[diff];

  const ops: Array<Rung["op"]> = ["+", "-", "x", "÷"];
  const rungs: Rung[] = [];

  while (rungs.length < 10) {
    const op = pick(ops, rnd);
    let a = randint(r, rnd);
    let b = randint(r, rnd);

    if (op === "÷") {
      b = Math.max(1, b);
      const k = randint({ min: 1, max: 10 }, rnd);
      a = b * k;
    }

    let expr = "";
    let answer = 0;

    if (op === "+") { answer = a + b; expr = `${a} + ${b}`; }
    else if (op === "-") { if (a < b) [a, b] = [b, a]; answer = a - b; expr = `${a} - ${b}`; }
    else if (op === "x") { answer = a * b; expr = `${a} × ${b}`; }
    else { answer = a / b; expr = `${a} ÷ ${b}`; }

    rungs.push({ expr, answer, op });
  }

  return { date: date.toISOString().slice(0, 10), difficulty: diff, rungs };
}

