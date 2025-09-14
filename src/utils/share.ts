// src/utils/share.ts

export type ShareOpts = {
  appName?: string;          // default "MicroMath"
  title?: string;            // optional title for navigator.share
  mode?: string;             // e.g., "Easy" | "Normal" | "Hard"
  score: number;
  total: number;

  // Support BOTH names so existing call sites keep working:
  ms?: number;               // preferred
  elapsedMs?: number;        // alias (back-compat)

  includeLink?: boolean;     // default true
  url?: string;              // defaults to window.location.origin if available
  extra?: string;            // e.g., "🔥 Streak 7 · ❄️ 1"
  style?: "A" | "B";         // optional formatting style
};

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

function bar(score: number, total: number) {
  const filled = "🟦".repeat(Math.max(0, Math.min(score, total)));
  const empty = "⬜️".repeat(Math.max(0, total - score));
  return filled + empty;
}

export function buildShareText(opts: ShareOpts) {
  const app = opts.appName ?? "MicroMath";

  // 🔑 normalize elapsed time: prefer ms, fall back to elapsedMs
  const elapsed = (opts.ms ?? opts.elapsedMs ?? 0);
  const time = fmtTime(elapsed);

  const modeLabel = opts.mode ? ` — ${opts.mode}` : "";
  const headline = `${app}${modeLabel} • ${opts.score}/${opts.total} in ${time}`;

  const bodyA = `${opts.extra ? opts.extra + "\n" : ""}${bar(opts.score, opts.total)}`;
  const bodyB = `${opts.extra ? opts.extra + "\n" : ""}Score: ${opts.score}/${opts.total} • Time: ${time}`;

  const body = opts.style === "A" ? bodyA : bodyB;
  const link = (opts.includeLink ?? true)
    ? (opts.url ?? (typeof window !== "undefined" ? window.location.origin : ""))
    : "";

  return link ? `${headline}\n${body}\n${link}` : `${headline}\n${body}`;
}

export async function shareResult(opts: ShareOpts) {
  const text = buildShareText(opts);
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
    /* user canceled share — ignore */
  }
}

// Back-compat alias so existing imports keep working
export { buildShareText as buildShare };
