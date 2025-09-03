import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Drift-proof mobile-safe countdown timer.
 * Uses a fixed end time (performance.now-based) so it stays accurate
 * even if the browser throttles timers or the tab is backgrounded.
 */
export default function Timer({
  durationMs = 60000,
  running,
  onExpire,
  format = "ss", // "ss" or "mm:ss"
  tickHz = 20,   // UI refresh rate; keep light for mobile
  className,
}: {
  durationMs?: number;
  running: boolean;
  onExpire?: () => void;
  format?: "ss" | "mm:ss";
  tickHz?: number;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<number>(durationMs);
  const endAtRef = useRef<number | null>(null);
  const intRef = useRef<number | null>(null);

  const computeRemaining = useCallback(() => {
    if (endAtRef.current == null) return durationMs;
    const now = performance.now();
    return Math.max(0, Math.round(endAtRef.current - now));
  }, [durationMs]);

  const tick = useCallback(() => {
    const r = computeRemaining();
    setRemaining(r);
    if (r <= 0) {
      stop();
      onExpire?.();
    }
  }, [computeRemaining, onExpire]);

  function start() {
    // start from the current remaining value (supports pause/resume)
    const now = performance.now();
    endAtRef.current = now + (remaining > 0 ? remaining : durationMs);
    clear();
    // Use a lightweight interval; remaining is computed from end time so drift doesn’t matter.
    intRef.current = window.setInterval(tick, Math.max(30, Math.floor(1000 / tickHz)));
    // Kick an immediate tick for snappy UI
    tick();
    document.addEventListener("visibilitychange", onVisibility, { passive: true });
  }

  function stop() {
    clear();
    // snap remaining to 0 when stopped by expiry
    setRemaining((r) => Math.max(0, r));
  }

  function clear() {
    if (intRef.current != null) {
      clearInterval(intRef.current);
      intRef.current = null;
    }
    document.removeEventListener("visibilitychange", onVisibility);
  }

  function onVisibility() {
    // Re-sync immediately when page becomes visible again.
    tick();
  }

  // When duration changes, reset remaining.
  useEffect(() => {
    setRemaining(durationMs);
    endAtRef.current = null;
    return clear;
  }, [durationMs]);

  // React to running state.
  useEffect(() => {
    if (running) start();
    else clear();
    return clear;
  }, [running]);

  const text = formatTime(remaining, format);

  return (
    <span
      className={className}
      aria-label={`Time remaining ${text}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </span>
  );
}

function formatTime(ms: number, fmt: "ss" | "mm:ss") {
  if (fmt === "ss") return Math.ceil(ms / 1000).toString();
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
