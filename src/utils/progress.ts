/* =============================================================================
   progress.ts — shared progress + best + calendar utilities
   Provides ALL exports your app expects:
     - buildWeekCalendar (returns { days, flags })
     - computeStreak
     - loadBestForMode
     - updateBestOnFinish
     - markPlayedToday
     - fmtTime
     - types: Mode, Best, WeekCell, WeekModel, WeekFlags
   LocalStorage keys used:
     - mm_streak, mm_lastPlayed
     - best:<mode>  -> { score, total, ms, timeMs }  (we write both ms & timeMs)
============================================================================= */

/* ---------------------------- Types ---------------------------- */

export type Mode = "easy" | "normal" | "hard";

/**
 * Best result per mode.
 * NOTE: We expose `ms` because your BestPill uses best.ms.
 * We also include optional `timeMs` for backward compatibility.
 */
export type Best = {
  score: number;   // highest score seen
  total: number;   // usually 8
  ms: number;      // best (lowest) time in milliseconds
  timeMs?: number; // legacy/alias, kept when saving for compatibility
};

export type WeekCell = {
  /** 'YYYY-MM-DD' */
  dateKey: string;
  /** Single letter label 'S'|'M'|'T'|'W'|'T'|'F'|'S' */
  label: string;
  /** true only for today */
  isToday: boolean;
  /** render as "done" (filled) */
  done: boolean;
};

export type WeekFlags = {
  todayKey: string;
  lastPlayed: string | null;
  streak: number;
  /** Which dates in THIS Sun→Sat week are considered "done" */
  doneKeysInWeek: string[];
};

export type WeekModel = {
  days: WeekCell[];
  flags: WeekFlags;
};

/* ------------------------- Small helpers ------------------------ */

/** Local YYYY-MM-DD for user's timezone */
export function todayKey(d: Date = new Date()): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole-day difference between two YYYY-MM-DD keys (local). */
export function daysBetween(aKey: string, bKey: string): number {
  const [ay, am, ad] = aKey.split("-").map(Number);
  const [by, bm, bd] = bKey.split("-").map(Number);
  const a = new Date(ay, am - 1, ad); // local midnight
  const b = new Date(by, bm - 1, bd); // local midnight
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekSunday(today: Date = new Date()): Date {
  const local = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = local.getDay(); // 0=Sun..6=Sat
  const start = new Date(local);
  start.setDate(local.getDate() - dow);
  return start;
}

/** mm:ss for UI (used by TodayChip and others) */
export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

/* ------------------------- Best tracking ------------------------ */

/**
 * Load best stats for a given mode from localStorage.
 * Stored format (now): { score, total, ms, timeMs }
 * We accept legacy { score, total, timeMs } or { score, total, ms } too.
 */
export function loadBestForMode(mode: Mode): Best | null {
  try {
    const raw = localStorage.getItem(`best:${mode}`);
    if (!raw) return null;
    const obj = JSON.parse(raw);

    if (typeof obj !== "object" || obj == null) return null;

    const score = Number(obj.score);
    const total = Number(obj.total);
    const msCandidate =
      Number.isFinite(obj.ms) ? Number(obj.ms)
      : Number.isFinite(obj.timeMs) ? Number(obj.timeMs)
      : Number.isFinite(obj.time) ? Number(obj.time) // ultra-legacy fallback
      : NaN;

    if (!Number.isFinite(score) || !Number.isFinite(total) || !Number.isFinite(msCandidate)) {
      return null;
    }

    return { score, total, ms: msCandidate, timeMs: msCandidate };
  } catch {
    return null;
  }
}

/**
 * Update best when a run finishes.
 * Rule:
 *   - If new score > old score → keep new (regardless of time).
 *   - If score ties and new time is faster → keep new.
 *   - Otherwise keep old.
 * We write both `ms` and `timeMs` for compatibility.
 */
export function updateBestOnFinish(
  mode: Mode,
  score: number,
  total: number,
  timeMs: number
): void {
  const prev = loadBestForMode(mode);
  let keep: Best = { score, total, ms: timeMs, timeMs };

  if (prev) {
    if (score > prev.score) {
      keep = { score, total, ms: timeMs, timeMs };
    } else if (score === prev.score && timeMs < prev.ms) {
      keep = { score, total, ms: timeMs, timeMs };
    } else {
      keep = prev;
    }
  }

  try {
    localStorage.setItem(`best:${mode}`, JSON.stringify({
      score: keep.score,
      total: keep.total,
      ms: keep.ms,
      timeMs: keep.ms, // keep alias in storage
    }));
  } catch {}
}

/* ------------------------- Played tracking ---------------------- */

/** Mark "last played" as today (used by your app on finish). */
export function markPlayedToday(): void {
  try {
    localStorage.setItem("mm_lastPlayed", todayKey());
  } catch {}
}

/* --------------------------- Streak API ------------------------- */
/**
 * computeStreak:
 * Your UI already updates streak elsewhere (updateStreakOnFinish in utils/streaks).
 * To stay consistent and not duplicate logic here, we simply read it.
 */
export function computeStreak(_flags?: unknown): number {
  const s = parseInt(localStorage.getItem("mm_streak") || "0", 10);
  return Number.isFinite(s) ? Math.max(0, s) : 0;
}

/* ---------------------- Weekly calendar builder ----------------- */
/**
 * Build the current Sun→Sat week model.
 * - If mm_streak > 0 and mm_lastPlayed exists:
 *     We mark the inclusive window [lastPlayed-(streak-1) .. lastPlayed] as "done".
 *   (Only days that fall inside this week will show as done.)
 * - Else if only lastPlayed exists:
 *     We mark that one day as "done".
 *
 * You can also pass { streak, lastPlayed } to override (optional).
 *
 * Returns:
 *   { days, flags } so callers can render the row and also use flags if needed.
 */
export function buildWeekCalendar(opts?: {
  streak?: number;
  lastPlayed?: string | null;
}): WeekModel {
  const letters = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date();
  const todayK = todayKey(today);

  // Pull from localStorage unless explicitly provided
  let streak = typeof opts?.streak === "number" ? opts!.streak! : computeStreak();
  let lastPlayed: string | null =
    typeof opts?.lastPlayed === "string" || opts?.lastPlayed === null
      ? (opts!.lastPlayed as string | null)
      : localStorage.getItem("mm_lastPlayed");

  streak = Number.isFinite(streak) ? Math.max(0, streak || 0) : 0;
  if (typeof lastPlayed !== "string") lastPlayed = null;

  // Compute streak window start (inclusive)
  let doneStartKey: string | null = null;
  if (streak > 0 && lastPlayed) {
    const [y, m, d] = lastPlayed.split("-").map(Number);
    const lp = new Date(y, m - 1, d);
    const start = new Date(lp);
    start.setDate(lp.getDate() - (streak - 1));
    doneStartKey = ymd(start);
  }

  // Iterate this week
  const start = startOfWeekSunday(today);
  const days: WeekCell[] = [];
  const doneKeysInWeek: string[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const k = ymd(date);
    const isToday = k === todayK;

    let done = false;
    if (streak > 0 && lastPlayed && doneStartKey) {
      done = k >= doneStartKey && k <= lastPlayed;
    } else if (lastPlayed) {
      done = k === lastPlayed;
    }
    if (done) doneKeysInWeek.push(k);

    days.push({
      dateKey: k,
      label: letters[i],
      isToday,
      done,
    });
  }

  const flags: WeekFlags = {
    todayKey: todayK,
    lastPlayed,
    streak,
    doneKeysInWeek,
  };

  return { days, flags };
}
