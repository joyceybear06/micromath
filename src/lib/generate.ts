// src/lib/generate.ts
// Forwarding shim so older imports keep working and everything uses the
// single source of truth in ../logic/generator.

export * from "../logic/generator";

// --- Types ---------------------------------------------------------------

import type { Step } from "../types";
export type { Step } from "../types";

// Operators used by hint/check logic.
// Include unicode × and ÷, their ASCII fallbacks x/* and /, and +-.
export type Operator = '+' | '-' | '×' | '÷' | 'x' | '*' | '/';

// Legacy alias: some older code/tests used `Rung`.
// We intentionally REPLACE any existing `op` in Step (if it had one) so
// `switch (r.op)` in check.ts accepts the exact cases used there.
export type Rung = Omit<Step, "op"> & { op: Operator };

// --- Back-compat: provide a stable `generateDay` symbol ------------------
// Some code imports `generateDay` from this shim, but the core generator
// might export a differently named function (e.g., generateDaily, generateRound).
// We import the whole module and pick the best available candidate.

import * as __gen from "../logic/generator";

type AnyFn = (...args: any[]) => any;

// Prefer names in this order; pick the first one that exists:
const __generateDayCandidate: AnyFn =
  // exact name first
  ( (__gen as Record<string, unknown>).generateDay as AnyFn | undefined ) ??
  // common alternatives next
  ( (__gen as Record<string, unknown>).generateDaily as AnyFn | undefined ) ??
  ( (__gen as Record<string, unknown>).generateRound as AnyFn | undefined ) ??
  ( (__gen as Record<string, unknown>).generate as AnyFn | undefined ) ??
  ( (__gen as Record<string, unknown>).buildDay as AnyFn | undefined ) ??
  // last resort: throw a clear error if none exist
  ((): never => {
    throw new Error(
      "[src/lib/generate.ts] No suitable day generator found in ../logic/generator. " +
      "Expected one of: generateDay, generateDaily, generateRound, generate, buildDay."
    );
  })();

// Export a stable, callable name for callers.
// Using a function export (not just const) avoids any tree-shaking edge cases.
export function generateDay(...args: any[]) {
  return (__generateDayCandidate as AnyFn)(...args);
}
