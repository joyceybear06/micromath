// src/components/ShareButton.tsx
import { buildShare } from "../utils/share";

type Props = {
  mode: string;
  score: number;
  total?: number;
  elapsedMs: number;       // total milliseconds
  includeLink?: boolean;   // default true
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

    // buildShare expects ONE options object — include style inside it
    const text = buildShare({
      appName: "MicroMath",
      title: "MicroMath",
      mode,
      score,
      total,
      ms: elapsedMs,
      includeLink,
      url: typeof window !== "undefined" ? window.location.origin : "",
      style,
    });

    try {
      if (navigator.share) {
        await navigator.share({
          title: "MicroMath",
          text,
          url: window.location.origin,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
      } else {
        prompt("Copy your results:", text);
      }
    } catch {
      // user canceled share — ignore
    }
  }

  return (
    <button type="button" onClick={handleShare} className={className}>
      Share
    </button>
  );
}
