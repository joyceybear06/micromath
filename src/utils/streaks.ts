// src/utils/streaks.ts
export type StreakState = {
  lastPlayed: string | null;     // "YYYY-MM-DD" (local)
  streak: number;                // consecutive days played
  freeze: 0 | 1;                 // 1 = available; consumed on a 1-day miss
  perfectSinceFreeze: number;    // count perfect runs since last freeze gain/use
};

const LS = {
  get(k: string) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string | number) {
    try { localStorage.setItem(k, String(v)); } catch {}
  }
};

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const A = new Date(ay, am - 1, ad);
  const B = new Date(by, bm - 1, bd);
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((B.getTime() - A.getTime()) / MS);
}

export function loadStreakState(): StreakState {
  const lastPlayed = LS.get("mm_lastPlayed");
  const streak = Number(LS.get("mm_streak") ?? 0) || 0;
  const freeze = Number(LS.get("mm_freeze") ?? 0) === 1 ? 1 : 0;
  const p = Number(LS.get("mm_perfectSinceFreeze") ?? 0) || 0;
  return { lastPlayed, streak, freeze, perfectSinceFreeze: p };
}

export function saveStreakState(s: StreakState) {
  LS.set("mm_lastPlayed", s.lastPlayed ?? "");
  LS.set("mm_streak", s.streak);
  LS.set("mm_freeze", s.freeze);
  LS.set("mm_perfectSinceFreeze", s.perfectSinceFreeze);
}

export function updateStreakOnFinish(score: number, total: number) {
  const s = loadStreakState();
  const today = todayKey();
  const diff = s.lastPlayed ? daysBetween(s.lastPlayed, today) : 0;

  if (!s.lastPlayed) {
    s.streak = 1;
  } else if (diff === 0) {
    // already played today
  } else if (diff === 1) {
    s.streak += 1;
  } else if (diff === 2 && s.freeze === 1) {
    s.freeze = 0;  // consume Freeze
    s.streak += 1; // preserve streak despite 1-day miss
  } else {
    s.streak = 1;  // missed > 1 day (or 2 days without freeze)
  }
  s.lastPlayed = today;

  let freezeEarned = false;
  if (score === total) {
    s.perfectSinceFreeze += 1;
    if (s.freeze === 0 && s.perfectSinceFreeze >= 3) {
      s.freeze = 1;
      s.perfectSinceFreeze = 0;
      freezeEarned = true;
    }
  }

  saveStreakState(s);
  try { window.dispatchEvent(new CustomEvent("mm-streak-change")); } catch {}
  return { ...s, freezeEarned };
}

export function isStreakPillHidden() {
  try { return localStorage.getItem("mm_hideStreaks") === "1"; } catch { return false; }
}
export function hideStreakPill() { try { localStorage.setItem("mm_hideStreaks", "1"); } catch {} }
export function showStreakPill() { try { localStorage.setItem("mm_hideStreaks", "0"); } catch {} }
