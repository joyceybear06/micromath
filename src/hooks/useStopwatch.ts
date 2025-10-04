import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Format milliseconds to mm:ss format (NO centiseconds)
 * @param ms - milliseconds to format
 * @returns formatted string like "1:23" or "0:07"
 */
export function formatMillis(ms: number): string {
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

/**
 * Drift-proof stopwatch hook with realistic update frequency
 * Clean mm:ss display format, mobile-optimized
 */
export function useStopwatch(opts: { autoStart?: boolean } = {}) {
  const { autoStart = false } = opts;

  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState<boolean>(!!autoStart);

  // Store the epoch time when stopwatch started
  const startEpochRef = useRef<number | null>(autoStart ? Date.now() : null);
  const intervalRef = useRef<number | null>(null);

  // Update frequency: 1000ms = 1 update per second (since we only show mm:ss)
  const UPDATE_INTERVAL = 250; // 4fps - smooth enough for seconds, battery efficient

  // Tick function - updates elapsed time
  const tick = useCallback(() => {
    if (startEpochRef.current != null) {
      const currentElapsed = Date.now() - startEpochRef.current;
      setElapsedMs(currentElapsed);
    }
  }, []);

  // Start the stopwatch
  const start = useCallback(() => {
    if (isRunning) return; // Already running
    
    const resumeOffset = elapsedMs;
    startEpochRef.current = Date.now() - resumeOffset;
    setIsRunning(true);
    
    // Use setInterval for consistent timing
    if (intervalRef.current == null) {
      // Update immediately, then every UPDATE_INTERVAL ms
      tick();
      intervalRef.current = window.setInterval(tick, UPDATE_INTERVAL);
    }
  }, [elapsedMs, isRunning, tick]);

  // Stop the stopwatch
  const stop = useCallback(() => {
    if (!isRunning) return; // Already stopped
    
    setIsRunning(false);
    
    // Clear interval
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Final update to ensure accuracy
    if (startEpochRef.current != null) {
      const finalElapsed = Date.now() - startEpochRef.current;
      setElapsedMs(finalElapsed);
    }
  }, [isRunning]);

  // Reset stopwatch
  const reset = useCallback(() => {
    setIsRunning(false);
    startEpochRef.current = null;
    setElapsedMs(0);
    
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle autoStart
  useEffect(() => {
    if (autoStart && startEpochRef.current == null && !isRunning) {
      startEpochRef.current = Date.now();
      setIsRunning(true);
      tick();
      intervalRef.current = window.setInterval(tick, UPDATE_INTERVAL);
    }
  }, [autoStart, tick, isRunning]);

  // Enhanced visibility handling for mobile reliability
  useEffect(() => {
    let wasRunning = false;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Remember if we were running when going to background
        wasRunning = isRunning;
        // Stop interval to save battery, but keep timing accurate
        if (intervalRef.current != null) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (document.visibilityState === "visible") {
        // Resume interval if we were running before
        if (wasRunning && intervalRef.current == null) {
          tick(); // Update immediately to show correct time
          intervalRef.current = window.setInterval(tick, UPDATE_INTERVAL);
        }
      }
    };

    const handleFocus = () => {
      // Extra reliability for mobile browsers
      if (isRunning && intervalRef.current == null) {
        tick();
        intervalRef.current = window.setInterval(tick, UPDATE_INTERVAL);
      }
    };

    const handleBlur = () => {
      // Stop updates when window loses focus
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Multiple event listeners for maximum mobile compatibility
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pageshow", handleFocus);
    window.addEventListener("pagehide", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pageshow", handleFocus);
      window.removeEventListener("pagehide", handleBlur);
      
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  // Legacy API compatibility
  const ms = elapsedMs;
  const running = isRunning;
  const formatted = useMemo(() => formatMillis(elapsedMs), [elapsedMs]);

  return {
    // New API
    elapsedMs,
    isRunning,
    start,
    stop,
    reset,
    
    // Legacy API compatibility
    ms,
    running,
    formatted
  };
}