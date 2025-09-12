// src/components/ResultsShareSlot.tsx
import ShareButton from "./ShareButton";
import ShareStyleToggle from "./ShareStyleToggle";

type Props = {
  status: "idle" | "playing" | "done";
  modeLabel: string;   // 'Easy' | 'Normal' | 'Hard'
  finalScore: number;  // 0..8
  total?: number;      // default 8
  elapsedMs: number;   // milliseconds
  className?: string;
};

export default function ResultsShareSlot({
  status,
  modeLabel,
  finalScore,
  total = 8,
  elapsedMs,
  className = "",
}: Props) {
  if (status !== "done") return null;

  return (
    <div className={`mt-2 flex items-center gap-10 flex-wrap ${className}`}>
      {/* Left: the Share button (works for any score) */}
      <ShareButton
        mode={modeLabel}
        score={finalScore}
        total={total}
        elapsedMs={elapsedMs}
      />

      {/* Right: tiny developer-facing toggle to switch styles quickly */}
      <ShareStyleToggle />
    </div>
  );
}
