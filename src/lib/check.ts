import type { Rung } from "./generate";

export function hintFor(r: Rung) {
  switch (r.op) {
    case "+": return "Think in tens.";
    case "-": return "Borrow or round to tens.";
    case "x": return "Use distributive: a×(b+c) = a×b + a×c.";
    case "÷": return "Check factors of the first number.";
  }
}

export function isCorrect(input: string, r: Rung) {
  const n = Number(input.trim());
  return Number.isFinite(n) && n === r.answer;
}

