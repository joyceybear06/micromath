/**
 * Feature flags used across the app.
 * Keep these simple booleans so TypeScript can tree-shake dead code
 * and avoid runtime surprises.
 *
 * STREAKS FLAG:
 * - Default: ON
 * - To disable: at build/deploy time, set VITE_FEATURE_STREAKS=off
 * - Any other value (or missing): treated as ON
 */
const raw = (import.meta as any)?.env?.VITE_FEATURE_STREAKS;
export const FEATURE_STREAKS: boolean = (raw ?? "on") !== "off";