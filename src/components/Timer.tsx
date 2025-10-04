import React, { useEffect } from "react";
import { useStopwatch, formatMillis } from "../hooks/useStopwatch";

/**
 * TimerDisplay is a thin, safe wrapper that renders the elapsed time.
 * It does not control game state; it only reacts to the `running` prop.
 *
 * Usage:
 *   <TimerDisplay running={true} />
 *   <TimerDisplay running={gameIsActive} />
 */
export default function TimerDisplay({ running }: { running: boolean }) {
  const { elapsedMs, start, stop } = useStopwatch();

  useEffect(() => {
    if (running) start();
    else stop();
  }, [running, start, stop]);

  return (
    <div
      aria-live="polite"
      className="font-mono tabular-nums text-xl md:text-2xl text-slate-900 dark:text-slate-100"
      data-testid="timer-display"
    >
      {formatMillis(elapsedMs)}
    </div>
  );
}
