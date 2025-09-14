// src/utils/share.ts

export type ShareOpts = {
  appName?: string;          // default "MicroMath"
  title?: string;            // optional title for navigator.share
  mode?: string;             // e.g., "Easy" | "Normal" | "Hard"
  score: number;
  total: number;

  // Either is accepted; we normalize internally.
  ms?: number;               // preferred
  elapsedMs?: number;        // alias (back-compat)

  includeLink?: boolean;     // default true (used only for navigator.share URL, not in text)
  url?: string;              // defaults to window.location.origin if available
  extra?: string;            // kept for compatibility — unused in the text now
  style?: "A" | "B";         // kept for compatibility — ignored in the text now
};

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

// Blue squares = correct answers; white squares = remaining
function squares(score: number, total: number) {
  const filled = "🟦".repeat(Math.max(0, Math.min(score, total)));
  const empty = "⬜️".repeat(Math.max(0, total - score));
  return filled + empty;
}

export function buildShareText(opts: ShareOpts) {
  const app = opts.appName ?? "MicroMath";
  const mode = opts.mode ?? "";
  const elapsed = (opts.ms ?? opts.elapsedMs ?? 0);
  const time = fmtTime(elapsed);

  // Line 1
  const header = mode
    ? `${app} — ${mode} • Score ${opts.score}/${opts.total} in ${time}`
    : `${app} • Score ${opts.score}/${opts.total} in ${time}`;

  // Line 2
  const bar = squares(opts.score, opts.total);

  // ⛔ No "Play: URL" line — text is exactly two lines now
  return `${header}\n${bar}`;
}

// Web Share API with clipboard fallback
export async function shareResult(opts: ShareOpts) {
  const text = buildShareText(opts);

  // We still attach the URL via the native share field (not in the text body)
  const shareUrl = (opts.includeLink ?? true)
    ? (opts.url ?? (typeof window !== "undefined" ? window.location.origin : ""))
    : undefined;

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: opts.title ?? opts.appName ?? "MicroMath",
        text,
        url: shareUrl,
      });
    } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } else {
      prompt("Copy your results:", text);
    }
  } catch {
    // user canceled — ignore
  }
}

// Back-compat alias for older imports
export { buildShareText as buildShare };
