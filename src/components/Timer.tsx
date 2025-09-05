// src/components/Timer.tsx
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    __mmTimer?: {
      start: () => void;
      pause: () => void;
      reset: () => void;
      getElapsedMs: () => number;
      isRunning: () => boolean;
    };
  }
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function Timer() {
  const [elapsed, setElapsed] = useState(0);
  const startAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const tick = (t: number) => {
    if (!runningRef.current || startAtRef.current == null) return;
    setElapsed(t - startAtRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (runningRef.current) return;
    const now = performance.now();
    startAtRef.current = now - elapsed;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(tick);
  };

  const pause = () => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const reset = () => {
    pause();
    setElapsed(0);
    startAtRef.current = null;
  };

  // expose globally + wire start-on-first-input and pause-on-blur
  useEffect(() => {
    window.__mmTimer = {
      start,
      pause,
      reset,
      getElapsedMs: () => elapsed,
      isRunning: () => runningRef.current,
    };

    const onDocInput = (e: Event) => {
      if (runningRef.current) return;
      const t = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!t) return;
      const val = (t as HTMLInputElement).value ?? "";
      if (val.length > 0) start();
    };
    const onBlur = () => pause();

    document.addEventListener("input", onDocInput, true);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("input", onDocInput, true);
      window.removeEventListener("blur", onBlur);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  return <span aria-label="Stopwatch" title="Stopwatch">{fmt(elapsed)}</span>;
}
