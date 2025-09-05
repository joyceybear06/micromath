import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type Stopwatch = {
  ms: number;
  running: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  formatted: string; // m:ss
};

function fmt(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function useStopwatch(): Stopwatch {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  const tick = useCallback((ts: number) => {
    if (!running) return;
    if (last.current != null) setMs(v => v + (ts - last.current!));
    last.current = ts;
    raf.current = requestAnimationFrame(tick);
  }, [running]);

  useEffect(() => {
    if (running) raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      last.current = null;
    };
  }, [running, tick]);

  const start = useCallback(() => { if (!running) setRunning(true); }, [running]);
  const stop  = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => { setRunning(false); setMs(0); last.current = null; }, []);

  const formatted = useMemo(() => fmt(ms), [ms]);
  return { ms, running, start, stop, reset, formatted };
}
