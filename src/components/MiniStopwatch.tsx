export default function MiniStopwatch({
  ms,
  onClick,
}: {
  ms: number;
  onClick?: () => void;
}) {
  // Match the header timer: M:SS
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString();
  const s = String(totalSec % 60).padStart(2, "0");

  return (
    <button
      className="mini-stopwatch"
      onClick={onClick}
      aria-label="Scroll to main timer"
      type="button"
    >
      ⏱ {m}:{s}
    </button>
  );
}
