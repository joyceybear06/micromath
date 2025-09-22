// src/components/StreakPill.tsx
import { useEffect, useState } from "react";
import { FEATURE_STREAKS } from "../config/flags.js";

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
  // Feature-flag gate: render nothing when streaks are off.
  if (!FEATURE_STREAKS) return null;

  const [s, setS] = useState(readState());

  useEffect(() => {
    // If the user previously hid the pill, show it again permanently
    try {
      localStorage.removeItem("mm_hideStreaks");
    } catch {}

    const onStorage = () => setS(readState());
    const onCustom = () => setS(readState());

    window.addEventListener("storage", onStorage);
    window.addEventListener("mm-streak-change", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mm-streak-change", onCustom as EventListener);
    };
  }, []);

  // Reuse your "meta-item" styling so it matches Perfect Days/Status chips
  return (
    <div
      className="meta-item streak-pill"
      aria-label={`Streak ${s.streak}, Freeze ${s.freeze}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <span>
        🔥 Streak <strong>{s.streak}</strong>
      </span>
      <span>
        · ❄️ <strong>{s.freeze}</strong>
      </span>
    </div>
  );
}
