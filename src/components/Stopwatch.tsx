import React, { useEffect } from "react";
import { useStopwatch, formatMillis } from "../hooks/useStopwatch";

interface StopwatchProps {
  /** Whether the stopwatch should be running */
  running: boolean;
}

/**
 * Numeric stopwatch display component
 * Shows elapsed time in mm:ss.cs format with no decorative elements
 * Starts when running becomes true, stops when running becomes false
 */
export default function Stopwatch({ running }: StopwatchProps) {
  // Don't use autoStart - we'll control start/stop manually based on running prop
  const { elapsedMs, isRunning, start, stop } = useStopwatch();

  // Control stopwatch based on running prop
  // This effect will run immediately when component mounts if running=true
  useEffect(() => {
    if (running && !isRunning) {
      // Start the stopwatch when running becomes true
      start();
    } else if (!running && isRunning) {
      // Stop the stopwatch when running becomes false
      stop();
    }
  }, [running, isRunning, start, stop]);

  return (
    <div
      data-testid="stopwatch-display"
      aria-live="polite"
      aria-label={`Elapsed time: ${formatMillis(elapsedMs)}`}
      className="
        stopwatch-numeric-display
        font-mono 
        tabular-nums 
        text-xl 
        md:text-2xl 
        leading-none 
        select-none
        !text-slate-900 
        dark:!text-slate-100 
        !bg-transparent 
        !shadow-none 
        !border-0
        !outline-none
        !ring-0
      "
      style={{
        background: "transparent !important",
        border: "none !important",
        boxShadow: "none !important",
        outline: "none !important",
        WebkitTextFillColor: "currentColor",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
      }}
    >
      {formatMillis(elapsedMs)}
    </div>
  );
}