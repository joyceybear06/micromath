// src/hooks/useMode.ts
import { useEffect, useState } from 'react';
import type { Mode } from '../types';

const KEY = 'micromath.mode';

/**
 * useMode()
 * - Returns a tuple [mode, setMode] so you can do:
 *   const [mode, setMode] = useMode();
 */
export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved === 'hard' ? 'hard' : 'normal';
    } catch {
      return 'normal';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignore storage errors */
    }
  }, [mode]);

  return [mode, setMode];
}
