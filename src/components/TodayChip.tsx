// src/components/TodayChip.tsx
import { fmtTime } from "../utils/progress";

type Status = "idle" | "playing" | "done";

export type TodayChipProps = {
  status: Status;
  score: number;
  total: number;
  timeMs: number;
};

export default function TodayChip({ status, score, total, timeMs }: TodayChipProps) {
  const hasResult = status === "playing" || status === "done";
  const value = hasResult ? `${score}/${total} · ${fmtTime(timeMs)}` : "—";

  return (
    <div className="pill" title="today’s result">
      <strong>Today</strong>
      <span className="meta-value" style={{ marginLeft: 6 }}>{value}</span>
    </div>
  );
}

// Also provide a named export so either style works.
export { TodayChip };
