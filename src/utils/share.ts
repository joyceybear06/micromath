// src/utils/share.ts

/** Simple emoji bar for the share text (optional, nice on mobile previews) */
export function bar(score: number, total: number) {
  const filled = "🟦".repeat(Math.max(0, Math.min(score, total)));
  const empty = "⬜️".repeat(Math.max(0, total - score));
  return filled + empty;
}

/** Convert ms → m:ss */
export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

/**
 * Build a nice default share text. You can pass any subset of fields.
 * If you already have your own text, skip this and call shareText() directly.
 */
export function buildShareText(opts: {
  appName?: string;        // default "MicroMath"
  modeLabel?: string;      // e.g., "Easy" | "Normal" | "Hard"
  score?: number;          // e.g., 6
  total?: number;          // e.g., 8
  elapsedMs?: number;      // total time in ms
  extra?: string;          // e.g., "🔥 Streak 7 · ❄️ 1"
  includeBar?: boolean;    // default true
  includePlayLink?: boolean; // default true
  url?: string;            // canonical link
}) {
  const {
    appName = "MicroMath",
    modeLabel,
    score,
    total,
    elapsedMs,
    extra,
    includeBar = true,
    includePlayLink = true,
    url = typeof window !== "undefined" ? window.location.origin : "",
  } = opts;

  const parts: string[] = [];

  // Header line
  const head: string[] = [appName];
  if (modeLabel) head.push(`— ${modeLabel}`);
  if (typeof score === "number" && typeof total === "number") head.push(`• ${score}/${total}`);
  if (typeof elapsedMs === "number") head.push(`in ${formatTime(elapsedMs)}`);
  parts.push(head.join(" "));

  // Optional extra line (e.g., streak pill)
  if (extra && extra.trim()) parts.push(extra.trim());

  // Optional bar
  if (includeBar && typeof score === "number" && typeof total === "number") {
    parts.push(bar(score, total));
  }

  // Play link
  if (includePlayLink && url) parts.push(`Play: ${url}`);

  return parts.join("\n");
}

/**
 * Try the Web Share API first; fall back to clipboard; finally, a prompt.
 * Returns the method used for telemetry/debug if you want.
 */
export async function shareText(
  text: string,
  url?: string,
  title = "MicroMath"
): Promise<"web-share" | "clipboard" | "prompt"> {
  // 1) Native share (best UX on iOS/Android and modern desktop)
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      // Some browsers are picky: avoid passing empty fields
      const data: ShareData = { title, text };
      if (url) data.url = url;
      await (navigator as any).share(data);
      return "web-share";
    }
  } catch {
    // user canceled or share failed → try clipboard next
  }

  // 2) Clipboard fallback (works on HTTPS or localhost)
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
      // Light UX nudge without adding a dependency
      alert("Copied to clipboard!");
      return "clipboard";
    }
  } catch {
    // Some browsers block clipboard → prompt fallback
  }

  // 3) Old-school prompt (always works)
  try {
    // eslint-disable-next-line no-alert
    prompt("Copy your results:", url ? `${text}\n${url}` : text);
  } catch {
    /* ignore */
  }
  return "prompt";
}

/** Convenience wrapper: build the message + share it in one call. */
export async function shareResult(opts: {
  appName?: string;
  modeLabel?: string;
  score?: number;
  total?: number;
  elapsedMs?: number;
  extra?: string;
  url?: string;
  title?: string;
}) {
  const text = buildShareText({
    appName: opts.appName,
    modeLabel: opts.modeLabel,
    score: opts.score,
    total: opts.total,
    elapsedMs: opts.elapsedMs,
    extra: opts.extra,
    url: opts.url,
  });
  const used = await shareText(text, opts.url, opts.title ?? opts.appName ?? "MicroMath");
  return { method: used, text };
}
// Back-compat: older code imports { buildShare } from "../utils/share"
export { buildShareText as buildShare };
