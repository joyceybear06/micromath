// src/utils/shareText.ts
export function formatTimeMMSS(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getShareUrl(): string {
  try {
    const u = new URL(window.location.href);
    return `${u.origin}${u.pathname}`;
  } catch {
    return window.location.href;
  }
}

export function buildShareText(opts: {
  score: number;
  total: number;
  elapsedMs: number;
  url?: string;
}): string {
  const { score, total, elapsedMs, url } = opts;
  const time = formatTimeMMSS(elapsedMs);
  const shareUrl = url || getShareUrl();
  return `I just finished MicroMath — Score ${score}/${total} in ${time}! ${shareUrl}`;
}
