// src/types.ts
export type Mode = 'normal' | 'hard';
export type Op = '+' | '-' | '×' | '÷' | '^';

export interface Step {
  /** What the user sees */
  prompt: string;
  /** Correct numeric answer */
  answer: number;
  /** Optional UI fields so generator returns are valid */
  userAnswer?: number | null;
  isCorrect?: boolean | null;
  
}
