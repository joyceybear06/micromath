import type { Rung } from "./generate";

// Helper: safely get operation symbol from a Rung/Step object
// Supports both `op` (older) and `operator` (newer) fields.
function getOp(r: Rung): string | undefined {
  const anyR = r as any;
  return anyR.op ?? anyR.operator;
}

export function hintFor(r: Rung) {
  const op = getOp(r);
  switch (op) {
    case "+":
      return "Think in tens.";
    case "-":
      return "Borrow or round to tens.";
    case "×":
      return "Use distributive: a(b + c) = ab + ac.";
    case "÷":
      return "Check factors of the first number.";
    default:
      return "";
  }
}

export function isCorrect(input: string, r: Rung) {
  const n = Number(input.trim());
  return Number.isFinite(n) && n === r.answer;
}
