// src/utils/difficulty.ts
export type Mode = "easy" | "medium" | "hard";
export type Q = { id: string; prompt: string; answer: number };

const randi = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// Make a ÷ b with integer result (optionally allow negatives on a)
function intDivPair(max: number, allowNeg: boolean): readonly [number, number] {
  const b = randi(1, max);
  const q = randi(1, Math.min(12, Math.floor(max / b) + 1));
  let a = b * q;
  if (allowNeg && Math.random() < 0.35) a = -a;
  return [a, b] as const;
}

function formatOp(op: string) {
  return op === "×" ? "×" : op === "÷" ? "÷" : op;
}

function powInt(base: number, exp: number) {
  // clamp base to keep results reasonable; exp ∈ {2,3}
  const b = Math.max(-6, Math.min(6, base));
  const e = exp === 2 || exp === 3 ? exp : 2;
  const res = Math.sign(b) * Math.pow(Math.abs(b), e);
  return res;
}

export function generateRun(mode: Mode): Q[] {
  const out: Q[] = [];
  const count = 8;

  for (let i = 0; i < count; i++) {
    let prompt = "";
    let answer = 0;

    if (mode === "easy") {
      // + / - / ×, operands 1–22, no negatives
      const ops = ["+", "-", "×"] as const;
      const a = randi(1, 22);
      const b = randi(1, 22);
      const op = pick(ops);
      if (op === "+") {
        prompt = `${a} + ${b}`;
        answer = a + b;
      } else if (op === "-") {
        const hi = Math.max(a, b);
        const lo = Math.min(a, b);
        prompt = `${hi} - ${lo}`;
        answer = hi - lo;
      } else {
        prompt = `${a} × ${b}`;
        answer = a * b;
      }
    }

    else if (mode === "medium") {
      // + / - / × / ÷ (integer only), operands 1–18, allow negatives
      const ops = ["+", "-", "×", "÷"] as const;
      const op = pick(ops);
      if (op === "÷") {
        const [a, b] = intDivPair(18, true);
        prompt = `${a} ÷ ${b}`;
        answer = a / b;
      } else {
        const a = randi(1, 18) * (Math.random() < 0.35 ? -1 : 1);
        const b = randi(1, 18) * (Math.random() < 0.35 ? -1 : 1);
        prompt = `${a} ${formatOp(op)} ${b}`;
        if (op === "+") answer = a + b;
        if (op === "-") answer = a - b;
        if (op === "×") answer = a * b;
      }
    }

    else {
      // HARD: + - × ÷ ^ ; allow negatives; 2–3 parentheses prompts per run (approx);
      // ensure integer results.
      // We construct safe patterns.
      const pattern = pick(["paren", "power", "div", "mix"]) as
        | "paren"
        | "power"
        | "div"
        | "mix";

      if (pattern === "div") {
        // (A ÷ B) op C
        const [A, B] = intDivPair(12, true);
        const C = randi(1, 20) * (Math.random() < 0.35 ? -1 : 1);
        const op = pick(["+", "-", "×"] as const);
        prompt = `(${A} ÷ ${B}) ${formatOp(op)} ${C}`;
        if (op === "+") answer = A / B + C;
        if (op === "-") answer = A / B - C;
        if (op === "×") answer = (A / B) * C;
      } else if (pattern === "power") {
        // (a ^ e) op b  (e = 2|3)
        let a = randi(-6, 6);
        if (a === 0) a = 2;
        const e = pick([2, 3] as const);
        const b = randi(1, 20) * (Math.random() < 0.35 ? -1 : 1);
        const op = pick(["+", "-", "×"] as const);
        const left = powInt(a, e);
        prompt = `(${a} ^ ${e}) ${formatOp(op)} ${b}`;
        if (op === "+") answer = left + b;
        if (op === "-") answer = left - b;
        if (op === "×") answer = left * b;
      } else if (pattern === "paren") {
        // a op (b op2 c) – avoid division inside unless integer
        const op = pick(["+", "-", "×"] as const);
        let b = randi(1, 20) * (Math.random() < 0.35 ? -1 : 1);
        let c = randi(1, 20) * (Math.random() < 0.35 ? -1 : 1);
        const op2 = pick(["+", "-", "×"] as const);
        const inner =
          op2 === "+"
            ? b + c
            : op2 === "-"
            ? b - c
            : b * c;
        const a = randi(1, 20) * (Math.random() < 0.35 ? -1 : 1);
        prompt = `${a} ${formatOp(op)} (${b} ${formatOp(op2)} ${c})`;
        if (op === "+") answer = a + inner;
        if (op === "-") answer = a - inner;
        if (op === "×") answer = a * inner;
      } else {
        // mix: (A ÷ B) op (c ^ e)
        const [A, B] = intDivPair(12, true);
        let c = randi(-6, 6);
        if (c === 0) c = 2;
        const e = pick([2, 3] as const);
        const left = A / B;
        const right = powInt(c, e);
        const op = pick(["+", "-", "×"] as const);
        prompt = `(${A} ÷ ${B}) ${formatOp(op)} (${c} ^ ${e})`;
        if (op === "+") answer = left + right;
        if (op === "-") answer = left - right;
        if (op === "×") answer = left * right;
      }
    }

    out.push({
      id: `${mode}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      answer,
    });
  }

  return out;
}
