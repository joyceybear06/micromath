// @ts-nocheck
import { useState, useEffect } from 'react';
import type { GameMode } from '../types.js';

const STORAGE_KEY = 'micromath.mode';

export function useMode() {
  const [mode, setMode] = useState<GameMode>('normal');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'normal' || stored === 'hard') {
      setMode(stored);
    }
  }, []);

  // Save to localStorage when mode changes
  const updateMode = (newMode: GameMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return { mode, setMode: updateMode };
}