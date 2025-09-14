// src/components/StreakPill.tsx
import { useEffect, useState } from "react";
import { isStreakPillHidden } from "../utils/streaks";

function readState() {
  try {
    const streak = Number(localStorage.getItem("mm_streak") ?? 0) || 0;
    const freeze = Number(localStorage.getItem("mm_freeze") ?? 0) === 1 ? 1 : 0;
    return { streak, freeze };
  } catch {
    return { streak: 0, freeze: 0 };
  }
}

export default function StreakPill() {
  const [hidden, setHidden] = useState(isStreakPillHidden());
  const [s, setS] = useState(readState());

  useEffect(() => {
    const onStorage = () => setS(readState());
    const onCustom = () => setS(readState());
    window.addEventListener("storage", onStorage);
    window.addEventListener("mm-streak-change", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mm-streak-change", onCustom as EventListener);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        fontSize: 13,
        backdropFilter: "blur(4px)",
      }}
      aria-label={`Streak ${s.streak}, Freeze ${s.freeze}`}
    >
      <span>🔥 Streak {s.streak}</span>
      <span>· ❄️ {s.freeze}</span>
      <button
        type="button"
        onClick={() => {
          try { localStorage.setItem("mm_hideStreaks", "1"); } catch {}
          setHidden(true);
        }}
        title="Hide"
        aria-label="Hide streaks pill"
        style={{
          marginLeft: 6,
          border: 0,
          background: "transparent",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
