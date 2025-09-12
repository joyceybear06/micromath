// src/components/ShareButton.tsx
import { buildShare } from "../utils/share";
import { shareText } from "../utils/shareText";

type Props = {
  mode: string;
  score: number;
  total?: number;
  elapsedMs: number;        // total milliseconds
  includeLink?: boolean;    // default true
  className?: string;
};

export default function ShareButton({
  mode,
  score,
  total = 8,
  elapsedMs,
  includeLink = true,
  className = "",
}: Props) {
  async function handleShare() {
    const style = (localStorage.getItem("mm_shareStyle") as "A" | "B") || "B";
    const text = buildShare(
      { mode, score, total, ms: elapsedMs, includeLink, url: window.location.origin },
      style
    );
    await shareText(text);
  }

  const label = score === total ? "Share your perfect run" : "Share your time";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`rounded-lg px-3 py-2 border shadow-sm ${className}`}
    >
      {label}
    </button>
  );
}
