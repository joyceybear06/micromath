// src/components/BestPill.tsx
import type { Best } from "../utils/progress";
import { fmtTime } from "../utils/progress";

export type BestPillProps = {
  modeLabel: string;
  best: Best | null;
};

function BestPill({ modeLabel, best }: BestPillProps) {
  const text = best
    ? `Best (${modeLabel}): ${best.score}/${best.total} · ${fmtTime(best.ms)}`
    : `Best (${modeLabel}): —`;

  return <div className="pill">{text}</div>;
}

export default BestPill;
export { BestPill };
