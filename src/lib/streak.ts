export type Mode = "easy" | "normal";

export function getStreak(mode: Mode): { current: number; best: number } {
  const key = `streak-${mode}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { current: 0, best: 0 };

  try {
    return JSON.parse(raw);
  } catch {
    return { current: 0, best: 0 };
  }
}


export function bumpStreak(mode: Mode, win: boolean) {
  try {
    const raw = localStorage.getItem("mm_streaks");
    const obj = raw ? JSON.parse(raw) : {};
    const cur = obj[mode]?.current ?? 0;
    const best = obj[mode]?.best ?? 0;
    const nextCur = win ? cur + 1 : 0;
    const nextBest = Math.max(best, nextCur);
    obj[mode] = { current: nextCur, best: nextBest, lastPlayed: new Date().toISOString().slice(0,10) };
    localStorage.setItem("mm_streaks", JSON.stringify(obj));
  } catch {}
}
export type Difficulty = "easy" | "normal";

export function getDifficulty(): Difficulty {
  try {
    const raw = localStorage.getItem("mm_settings");
    const obj = raw ? JSON.parse(raw) : {};
    return (obj.difficulty as Difficulty) || "normal";
  } catch {
    return "normal";
  }
}

export function setDifficulty(d: Difficulty) {
  try {
    const raw = localStorage.getItem("mm_settings");
    const obj = raw ? JSON.parse(raw) : {};
    obj.difficulty = d;
    localStorage.setItem("mm_settings", JSON.stringify(obj));
  } catch {}
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function hasPlayedToday(mode: Mode) {
  try {
    const raw = localStorage.getItem("mm_streaks");
    const obj = raw ? JSON.parse(raw) : {};
    return obj[mode]?.lastPlayed === todayISO();
  } catch {
    return false;
  }
}

export function setPlayedToday(mode: Mode) {
  try {
    const raw = localStorage.getItem("mm_streaks");
    const obj = raw ? JSON.parse(raw) : {};
    const s = obj[mode] || { current: 0, best: 0 };
    s.lastPlayed = todayISO();
    obj[mode] = s;
    localStorage.setItem("mm_streaks", JSON.stringify(obj));
  } catch {}
}
export function getStreakInfo(mode: Mode) {
  try {
    const raw = localStorage.getItem("mm_streaks");
    const obj = raw ? JSON.parse(raw) : {};
    const current = obj[mode]?.current ?? 0;
    const best = obj[mode]?.best ?? 0;
    return { current, best };
  } catch {
    return { current: 0, best: 0 };
  }
}
