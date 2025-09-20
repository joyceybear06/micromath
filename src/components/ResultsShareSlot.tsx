// src/components/ResultsShareSlot.tsx
// Renders nothing so the results card shows only "FINAL SCORE" and the score.

type Props = {
  status: string;
  modeLabel: string;
  finalScore: number;
  total: number;
  elapsedMs: number;
  className?: string;
};

export default function ResultsShareSlot(_: Props) {
  return null;
}
