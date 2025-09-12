// src/utils/share.ts
export type ShareStyle = "A" | "B";

const pad = (n: number) => n.toString().padStart(2, "0");
export function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${pad(sec)}`;
}

/**
 * Build plain-text share message. Link is optional to keep iMessage text-first.
 */
export function buildShare(
  params: {
    mode: string;
    score: number;
    total?: number;
    ms: number;
    includeLink?: boolean;
    url?: string;
  },
  style: ShareStyle = "B"
) {
  const { mode, score, total = 8, ms, includeLink = true, url = location.origin } = params;
  const time = formatMs(ms);

  if (style === "B") {
    // Stopwatch line (ultra-minimal)
    let text = `⏱ ${time} • ${score}/${total} • ${mode} — MicroMath`;
    if (includeLink) text += `\nPlay: ${url}`;
    return text;
  }

  // Style A (emoji line)
  const filled = "🟦".repeat(Math.max(0, Math.min(score, total)));
  const empty = "⬜️".repeat(Math.max(0, total - score));
  let text = `MicroMath — ${mode} • ${score}/${total} in ${time}\n${filled}${empty}`;
  if (includeLink) text += `\nPlay: ${url}`;
  return text;
}
