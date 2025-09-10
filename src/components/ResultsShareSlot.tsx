// src/components/ResultsShareSlot.tsx
import ShareButton from "./ShareButton";

type Props = {
  score: number;       // current score
  total: number;       // usually 8
  elapsedMs: number;   // milliseconds
};

export default function ResultsShareSlot({ score, total, elapsedMs }: Props) {
  const isPerfect = score === total;
  if (!isPerfect) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <ShareButton score={score} total={total} elapsedMs={elapsedMs} />
    </div>
  );
}
