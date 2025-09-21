// src/components/ResultsCTAs.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ShareButton from "./ShareButton";

type ResultsCTAsProps = {
  /** Mode label used by ShareButton. If not provided, defaults to "easy". */
  mode?: string;
  /** Final score (0..total) */
  score?: number;
  /** Elapsed time in milliseconds */
  elapsedMs?: number;

  /** Optional aria-label for the group */
  ariaLabel?: string;
  /** Optional override for "Play another" behavior */
  onPlayAnother?: () => void;
  /** Optional override for "Give feedback" behavior */
  onFeedback?: () => void;
  /** Optional extra className */
  className?: string;
};

export default function ResultsCTAs({
  mode = "easy",
  score = 0,
  elapsedMs = 0,
  ariaLabel = "Results actions",
  onPlayAnother,
  onFeedback,
  className,
}: ResultsCTAsProps) {
  const navigate = useNavigate();

  const goHomeNoMode = React.useCallback(() => {
    // Always send to Home without preselecting a mode.
    navigate("/", { replace: false });
  }, [navigate]);

  const goFeedback = React.useCallback(() => {
    // If /feedback route does not exist yet, user will see 404 (safe for builds).
    navigate("/feedback", { replace: false });
  }, [navigate]);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "1fr",
        justifyItems: "stretch",
        alignItems: "center",
        width: "100%",
        maxWidth: 420,
        margin: "16px auto 0",
      }}
    >
      {/* Share */}
      <ShareButton mode={mode} score={score} elapsedMs={elapsedMs} />

      {/* Give feedback */}
      <button
        type="button"
        onClick={onFeedback ?? goFeedback}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "#fff",
          color: "#111",
          fontWeight: 600,
          cursor: "pointer",
        }}
        aria-label="Give feedback"
      >
        Give feedback
      </button>

      {/* Play another → Home (no mode) */}
      <button
        type="button"
        onClick={onPlayAnother ?? goHomeNoMode}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "none",
          background: "#2563EB",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
        }}
        aria-label="Play another"
      >
        Play another
      </button>
    </div>
  );
}
