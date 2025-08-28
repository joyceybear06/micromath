// src/types.ts
export type Mode = 'normal' | 'hard';
export type Op = '+' | '-' | '×' | '÷' | '^';

export interface Step {
  /** What the user sees */
  prompt: string;
  /** Correct numeric answer */
  answer: number;
  /** Optional UI fields so both generator and UI compile */
  userAnswer?: number | null;
  isCorrect?: boolean | null;
}
