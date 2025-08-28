// @ts-nocheck
export type GameMode = 'normal' | 'hard';

export type Operator = '+' | '-' | '*' | '/' | '^';

export interface Step {
  prompt: string;  // e.g., "15 + 7 = ?"
  answer: number;  // correct answer
  userAnswer: string;  // what user typed
  isCorrect: boolean | null;  // null = not answered yet
}

export interface GameState {
  mode: GameMode;
  steps: Step[];
  isPlaying: boolean;
  isFinished: boolean;
  startTime: number | null;
  timeRemaining: number; // seconds left
  timerInterval: NodeJS.Timeout | null;
}