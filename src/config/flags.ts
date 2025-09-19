// src/config/flags.ts
export const FEATURE_STREAKS: boolean =
  (import.meta.env?.VITE_FEATURE_STREAKS ?? "off") === "on";
