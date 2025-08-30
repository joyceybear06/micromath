// src/lib/generate.ts
// Forwarding shim so older imports keep working and everything uses the
// single source of truth in ../logic/generator.

export * from "../logic/generator";

// Re-export types so callers can keep importing from "src/lib/generate".
import type { Step } from "../types";
export type { Step } from "../types";

// Legacy alias: some older code/tests used `Rung`. Keep as alias to Step.
export type Rung = Step;
