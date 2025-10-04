// src/lib/generate.ts
// Forwarding shim so older imports keep working and everything uses the
// single source of truth in ../logic/generator.

import * as core from "../logic/generator";

// Re-export types so callers can keep importing from "src/lib/generate".
export type { Step } from "../types";
export type { Step as Rung } from "../types"; // Legacy alias if older code used Rung

// Pick the best available generator name from the core module.
// We intentionally keep this loose to avoid tight coupling to core signatures.
type AnyFn = (...args: any[]) => any;

function pickGenerator(): AnyFn {
  const c = core as Record<string, unknown>;

  return (
    (c.generateDay as AnyFn | undefined) ??
    (c.generateDaily as AnyFn | undefined) ??
    (c.generateRound as AnyFn | undefined) ??
    (c.generate as AnyFn | undefined) ??
    (c.buildDay as AnyFn | undefined) ??
    (() => {
      throw new Error(
        "[lib/generate] No suitable generator exported from ../logic/generator. " +
          "Expected one of: generateDay, generateDaily, generateRound, generate, buildDay."
      );
    })
  );
}

// ✅ Stable, named export used by Play.tsx
export const generate: AnyFn = pickGenerator();

// (Optional) still allow star re-exports for direct access to other helpers
export * from "../logic/generator";
