// src/components/ShareButton.tsx
import React from "react";

type Props = {
  mode: string;        // "easy" | "normal" | "hard" | etc.
  score: number;       // 0..8
  elapsedMs: number;   // time to finish, in ms
  className?: string;
};

function formatElapsed(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return mm > 0 ? `${mm}:${ss.toString().padStart(2, "0")}` : `0:${ss.toString().padStart(2, "0")}`;
}

export default function ShareButton({ mode, score, elapsedMs, className }: Props) {
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  // Fire-and-forget analytics (non-blocking, no await)
  function trackShareClick() {
    try {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: "share_click",
          mode,
          score,
          elapsedMs,
          ts: Date.now(),
        }),
        keepalive: true, // survive page navigations in supported browsers
      });
    } catch {
      // swallow any network errors silently
    }
  }

  const onShare = async () => {
    // Build share text
    const timeStr = formatElapsed(elapsedMs);
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://micromath.app";
    const url = origin + "/"; // share Home (no mode)
    const title = "MicroMath — Your Daily Math Dealer";
    const text = `I scored ${score}/8 in ${timeStr} on MicroMath (${mode}). Try today’s puzzle:\n${url}`;

    // send analytics first (non-blocking)
    trackShareClick();

    try {
      setBusy(true);

      // Access navigator via a local var with an explicit type to keep TS happy
      const nav: Navigator | undefined =
        typeof navigator !== "undefined" ? (navigator as Navigator) : undefined;

      // 1) Native Web Share API (mobile + some desktop)
      const maybeShare: unknown = (nav as any)?.share;
      if (typeof maybeShare === "function") {
        // User cancel throws in some UAs; ignore it
        await (maybeShare as (data: any) => Promise<void>)({ title, text, url }).catch(() => {});
        setBusy(false);
        return;
      }

      // 2) Clipboard fallback (desktop)
      const clip: Clipboard | undefined = (nav as any)?.clipboard as Clipboard | undefined;
      if (clip && typeof clip.writeText === "function") {
        await clip.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        setBusy(false);
        return;
      }

      // 3) Last resort: prompt for manual copy
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-alert
        window.prompt("Copy the text below to share:", text);
      }
      setBusy(false);
    } catch {
      // Never break UI on share cancel or odd browser errors
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
        color: "#111",
        fontWeight: 600,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.7 : 1,
      }}
      aria-label="Share results"
    >
      {copied ? "Copied!" : busy ? "Sharing…" : "Share"}
    </button>
  );
}
