// src/logic/generator.ts
import type { Mode, Op, Step } from '../types';
import {
  randInt, choice, randomFactorOf,
  makeSeededRng, sRandInt, sChoice, sRandomFactorOf
} from '../utils/rand';

const NORMAL_OPS: Op[] = ['+', '-', '×', '÷'];
const HARD_OPS: Op[] = ['+', '-', '×', '÷', '^'];
const LIMIT = 5000;

const applyOp = (a: number, op: Op, b: number): number => {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return a / b; // caller ensures divisibility
    case '^': return a ** b;
    default:  return NaN;   // satisfies TS exhaustiveness
  }
};

const safeClamp = (n: number) => Number.isFinite(n) && Math.abs(n) <= LIMIT;

const randomAddend = (rng?: () => number) => rng ? sRandInt(rng, 2, 15) : randInt(2, 15);
const randomMultiplier = (rng?: () => number) => rng ? sRandInt(rng, 2, 9) : randInt(2, 9);
const randomBase = (rng?: () => number) => rng ? sRandInt(rng, 2, 9) : randInt(2, 9);
const randomExponent = (rng?: () => number) => rng ? sRandInt(rng, 2, 3) : randInt(2, 3);
const pick = <T,>(ops: readonly T[], rng?: () => number) => rng ? sChoice(rng, ops) : choice(ops);
const factorOf = (n: number, rng?: () => number) => rng ? sRandomFactorOf(rng, n) : randomFactorOf(n);
const maybe = (p: number, rng?: () => number) => (rng ? rng() : Math.random()) < p;

const buildBinaryStep = (cur: number, ops: Op[], hard: boolean, rng?: () => number): Step | null => {
  let op = pick(ops, rng);
  if (!hard && op === '^') op = pick(NORMAL_OPS, rng);

  let b: number;
  if (op === '+') b = randomAddend(rng);
  else if (op === '-') b = randomAddend(rng);
  else if (op === '×') b = randomMultiplier(rng);
  else if (op === '^') {
    b = randomExponent(rng);
    if (Math.abs(cur) > 20) cur = rng ? sRandInt(rng, 2, 10) : randInt(2, 10);
  } else {
    const abs = Math.abs(cur);
    if (abs === 0) { op = '+'; b = randomAddend(rng); }
    else { b = factorOf(cur, rng); }
  }

  const next = applyOp(cur, op, b);
  if (!Number.isInteger(next) || !safeClamp(next)) return null;
  return { prompt: `${cur} ${op} ${b}`, answer: next };
};

const buildParenStepHard = (cur: number, rng?: () => number): Step | null => {
  const OUTER_OPS: Op[] = ['+', '-', '×', '÷'];
  const INNER_OPS: Op[] = ['+', '-', '×', '÷', '^'];
  const op1 = pick(OUTER_OPS, rng);
  let op2 = pick(INNER_OPS, rng);

  let x!: number, y!: number, inner!: number;
  for (let tries = 0; tries < 8; tries++) {
    if (op2 === '+') { x = rng ? sRandInt(rng, 2, 15) : randInt(2, 15); y = rng ? sRandInt(rng, 2, 15) : randInt(2, 15); }
    else if (op2 === '-') { x = rng ? sRandInt(rng, 5, 25) : randInt(5, 25); y = rng ? sRandInt(rng, 2, Math.min(20, x - 1)) : randInt(2, Math.min(20, x - 1)); }
    else if (op2 === '×') { x = rng ? sRandInt(rng, 2, 12) : randInt(2, 12); y = rng ? sRandInt(rng, 2, 9) : randInt(2, 9); }
    else if (op2 === '÷') { x = rng ? sRandInt(rng, 6, 60) : randInt(6, 60); y = factorOf(x, rng); }
    else { x = randomBase(rng); y = randomExponent(rng); }
    inner = applyOp(x, op2, y);
    if (Number.isInteger(inner) && safeClamp(inner)) break;
  }
  if (!Number.isInteger(inner) || !safeClamp(inner)) return null;

  let prompt = `${cur} ${op1} (${x} ${op2} ${y})`;
  let answer: number;

  if (op1 === '÷') {
    if (inner === 0) return null;
    if (cur % inner !== 0) {
      const alt = applyOp(cur, '×', inner);
      if (!Number.isInteger(alt) || !safeClamp(alt)) return null;
      prompt = `${cur} × (${x} ${op2} ${y})`;
      answer = alt;
      return { prompt, answer };
    }
  }

  answer = applyOp(cur, op1, inner);
  if (!Number.isInteger(answer) || !safeClamp(answer)) return null;

  return { prompt, answer };

  // Safety net so TS is happy even if control flow analysis misses a path
  // (this line is never reached in practice).
  // return null;
};

const buildLadder = (mode: Mode, rng?: () => number): Step[] => {
  const hard = mode === 'hard';
  const length = hard ? 10 : 5;
  const ops = hard ? HARD_OPS : NORMAL_OPS;

  let cur = rng ? sRandInt(rng, 2, 12) : randInt(2, 12);
  const steps: Step[] = [];

  while (steps.length < length) {
    let step: Step | null = null;
    if (hard && maybe(0.3, rng)) step = buildParenStepHard(cur, rng);
    if (!step) for (let tries = 0; tries < 6 && !step; tries++) step = buildBinaryStep(cur, ops, hard, rng);

    if (!step) { cur = rng ? sRandInt(rng, 2, 12) : randInt(2, 12); continue; }
    steps.push(step);
    cur = step.answer;
  }
  return steps;
};

// Public APIs
export const generateLadder = (mode: Mode): Step[] => buildLadder(mode);
export const generateLadderForSeed = (mode: Mode, seedStr: string): Step[] => {
  const rng = makeSeededRng(seedStr);
  return buildLadder(mode, rng);
};
