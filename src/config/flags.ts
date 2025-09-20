// src/config/flags.ts

/**
 * Feature flags used across the app.
 * Keep these simple booleans so TypeScript can tree-shake dead code
 * and to avoid runtime surprises.
 */

/**
 * Gate for all streak-related reads/writes and UI.
 * - true  → enable streak logic
 * - false → disable streak logic (no localStorage writes, pill hidden)
 */
export const FEATURE_STREAKS = true;
