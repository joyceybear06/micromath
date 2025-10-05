import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { useMode } from "./hooks/useMode.js";
import { generateLadder, generateLadderForSeed } from "./logic/generator.js";
import { generateEasy, generateEasyForSeed } from "./logic/easy.js";
import type { Step } from "./types.js";
import ResultsShareSlot from "./components/ResultsShareSlot.js";

import "./App.css";

/* Stopwatch & input */
import { useStopwatch } from "./hooks/useStopwatch.js";
import SmartNumberInput from "./components/SmartNumberInput.js";
import { useTheme, type Theme } from "./hooks/useTheme.js";

/* Flags + Streak + share */
import { FEATURE_STREAKS } from "./config/flags.js";
import { updateStreakOnFinish } from "./utils/streaks.js";
import { shareResult } from "./utils/share.js";

/* Sticky header */
import StickyHeader from "./components/StickyHeader.js";

/* Habit-row components */
import WeeklyCalendarRow from "./components/WeeklyCalendarRow.js";
/* TodayChip removed by request */
import BestPill from "./components/BestPill.js";
import StreakCaption from "./components/StreakCaption.js";

/* Progress helpers */
import {
  buildWeekCalendar,
  computeStreak,
  loadBestForMode,
  markPlayedToday,
  updateBestOnFinish,
  type Mode,
} from "./utils/progress.js";

import ResetButton from "./components/ResetButton.js";
import Feedback from "./routes/Feedback";
import { useNavigate } from "react-router-dom";

type Status = "idle" | "playing" | "done";

const pad = (n: number) => n.toString().padStart(2, "0");
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Rotating encouragements for NON-perfect runs */
const ENCOURAGEMENTS = [
  "You're close—Keep Going!",
  "Almost there—Push Through!",
  "Nice effort—Try Again!",
  "So close—One More Go!",
  "Good work—Finish Strong!",
];

/** ZERO-STREAK sentence options */
const ZERO_STREAK_OPTIONS = [
  "Start your streak today.",
  "No run yet — press Start to begin.",
  "First day starts now—give it a try!",
] as const;
const ZERO_STREAK_MSG = ZERO_STREAK_OPTIONS[0];

/* ---------------- Inline Results Modal ---------------- */
type ResultsProps = {
  open: boolean;
  timeMs: number;
  score: number;
  total: number;
  perfect: boolean;
  onClose: () => void;
  message?: string;
};

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

function InlineResultsModal({
  open,
  timeMs,
  score,
  total,
  perfect,
  onClose,
  message,
}: ResultsProps) {
  const isDark =
    typeof document !== "undefined" &&
    (document.body.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark") ||
      document.documentElement.classList.contains("dark"));

  const panelBg = isDark ? "#1f2937" : "#ffffff";
  const panelBorder = isDark ? "#334155" : "#e5e7eb";
  const panelText = isDark ? "#f8fafc" : "#111827";

  const navigate = useNavigate();
  const goFeedback = () => navigate("/feedback", { replace: false });

  useEffect(() => {
    if (!open) return;
    let canceled = false;
    (async () => {
      try {
        // @ts-ignore optional confetti
        const mod = await import("canvas-confetti");
        if (canceled) return;
        mod.default({
          particleCount: perfect ? 160 : 80,
          spread: perfect ? 90 : 70,
          startVelocity: perfect ? 55 : 35,
          origin: { y: 0.6 },
          scalar: perfect ? 1.1 : 0.9,
        });
      } catch {}
    })();
    return () => {
      canceled = true;
    };
  }, [open, perfect]);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    await shareResult({
      appName: "MicroMath",
      score,
      total,
      elapsedMs: timeMs,
      url,
      title: "MicroMath",
    });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: panelBg,
          color: panelText,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          padding: 20,
          border: `1px solid ${panelBorder}`,
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800 }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 999,
              background: perfect
                ? "linear-gradient(90deg,#a78bfa,#fca5a5)"
                : "linear-gradient(90deg,#c4b5fd,#bfdbfe)",
              color: "#111827",
            }}
          >
            {perfect ? "Perfect run!" : "Nice work!"}
          </span>
        </h2>

        <div style={{ lineHeight: 1.7, marginBottom: 12 }}>
          <div>
            Score: <strong>{score}</strong> / {total}
          </div>
          <div>
            Time: <strong>{fmtTime(timeMs)}</strong>
          </div>
        </div>

        {!perfect && (
          <p
            style={{
              marginTop: 6,
              marginBottom: 10,
              color: isDark ? "#e5e7eb" : "#374151",
            }}
          >
            {message ?? "Nice effort—Try again! A little every day builds speed."}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onShare}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${panelBorder}`,
              background: isDark ? "#1f2937" : "#f8fafc",
              color: panelText,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Share
          </button>

          <button
            onClick={goFeedback}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${panelBorder}`,
              background: isDark ? "#1f2937" : "#f8fafc",
              color: panelText,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Give feedback
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
/* ---------------------------- End modal ----------------------------------- */

/* ------------------------- MiniStopwatch (floating) ----------------------- */
function MiniStopwatch({
  text,
  onClick,
  visible,
}: {
  text: string;
  onClick?: () => void;
  visible: boolean;
}) {
  return (
    <button
      className={`mini-stopwatch ${visible ? "show" : "hide"}`}
      onClick={onClick}
      aria-label="Scroll to main timer"
      type="button"
    >
      {text}
    </button>
  );
}
/* ------------------------------------------------------------------------- */

export default function App() {
  const [mode, setMode] = useMode();
  const [status, setStatus] = useState<Status>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  const [paused, setPaused] = useState<boolean>(false);

  // THEME (persisted)
  const [theme, setTheme] = useTheme();

  // ensure the theme attribute is on <body>
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-theme", theme);
    }
  }, [theme]);

  // Stopwatch
  const sw = useStopwatch();

  // Results modal state
  const [results, setResults] = useState({
    open: false,
    timeMs: 0,
    score: 0,
    total: 8,
    perfect: false,
    message: undefined as string | undefined,
  });

  // Daily seed + played-today key
  const seed = `${mode}-${todayKey()}`;
  const playedKey = `played:${seed}`;
  const canPlayToday = !isDaily || !localStorage.getItem(playedKey);

  // session key + resetToHome
  const [session, setSession] = useState(0);
  const resetToHome = () => {
    setStatus("idle");
    setSteps([]);
    setAnswers([]);
    setPaused(false);
    sw.reset();
    setResults((r) => ({ ...r, open: false }));
    setSession((s) => s + 1); // force remount of main area
  };

  // Start / Finish / Reset ----------------------------------------------------
  const start = () => {
    if (!canPlayToday) return;

    let ladder: Step[];
    if (mode === "easy") {
      ladder = isDaily ? generateEasyForSeed(seed) : generateEasy();

      // EASY ONLY: remove ÷ and top-up to 8 questions
      ladder = ladder.filter((s) => !s.prompt.includes("÷"));
      if (ladder.length < 8) {
        const seen = new Set(ladder.map((s) => s.prompt));
        while (ladder.length < 8) {
          const more = generateEasy().filter((s) => !s.prompt.includes("÷"));
          for (const step of more) {
            if (!seen.has(step.prompt)) {
              ladder.push(step);
              seen.add(step.prompt);
              if (ladder.length >= 8) break;
            }
          }
          if (more.length === 0) break;
        }
      }
      ladder = ladder.slice(0, 8);
    } else {
      ladder = isDaily ? generateLadderForSeed(mode, seed) : generateLadder(mode);
      ladder = ladder.filter((s) => Number.isInteger(s.answer)).slice(0, 8);
    }

    setSteps(ladder);
    setAnswers(Array(ladder.length).fill(""));

    setStatus("playing");
    setPaused(false);

    sw.reset(); // reset to 0:00 until first keystroke
  };

  const finish = () => {
    setStatus("done");
    if (isDaily) localStorage.setItem(playedKey, "1");

    sw.stop();

    const score = steps.length
      ? steps.reduce(
          (acc, s, i) => acc + (Number(answers[i]) === s.answer ? 1 : 0),
          0
        )
      : 0;
    const perfect = steps.length > 0 && score === steps.length;

    if (FEATURE_STREAKS) {
      updateStreakOnFinish(score, steps.length || 8);
    }

    const modeKey = mode as Mode;
    markPlayedToday();
    updateBestOnFinish(modeKey, score, steps.length || 8, sw.ms);

    const pickEnc = () => {
      if (perfect) return undefined;
      const len = ENCOURAGEMENTS.length;
      return ENCOURAGEMENTS[Math.floor(Math.random() * len)];
    };

    setResults({
      open: true,
      timeMs: sw.ms,
      score,
      total: steps.length || 8,
      perfect,
      message: pickEnc(),
    });
  };

  const reset = () => {
    setStatus("idle");
    setSteps([]);
    setAnswers([]);
    setPaused(false);
    sw.reset();
  };

  // Let CSS know when a round is running (for mobile timer positioning)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const v = status === "playing" ? "1" : "0";
    document.body.setAttribute("data-playing", v);
    return () => {
      document.body.removeAttribute("data-playing");
    };
  }, [status]);

  /* ============================================================================
     🔒 Start-on-First-Character (Mobile & Desktop, Race-proof)
     - useLayoutEffect: attaches listeners BEFORE browser paints after status change,
       so a very fast first tap cannot beat the handler.
     - capture phase: nothing can swallow the event before we see it.
     - events: beforeinput + input + paste + keydown (belt & suspenders).
     - starts on ANY inserted character (first char) in an answer field.
     - idempotent: guarded by local flag + sw.running.
  ============================================================================ */
  useLayoutEffect(() => {
    if (status !== "playing" || paused || sw.running) return;

    let started = false;

    const isAnswerInput = (el: EventTarget | null): el is HTMLInputElement => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      if (node.classList?.contains("answer-input")) return true;
      const closest = node.closest?.(".answer-input");
      return !!closest;
    };

    const startNow = () => {
      if (started || sw.running || status !== "playing" || paused) return;
      started = true;
      sw.start();
    };

    const onBeforeInput = (e: Event) => {
      const be = e as InputEvent;
      const target = e.target as HTMLElement | null;
      if (!isAnswerInput(target)) return;

      // Any insertion starts it (covers mobile keyboards, emoji, etc.)
      if (be.inputType && be.inputType.startsWith("insert")) {
        // data may be null on some numeric inputs on iOS; still start.
        startNow();
      }
    };

    const onInput = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!isAnswerInput(target)) return;

      // If value length > 0, a character is present in the box; start.
      const inputEl =
        (target?.classList?.contains("answer-input")
          ? (target as HTMLInputElement)
          : (target?.closest?.(".answer-input") as HTMLInputElement | null)) ?? null;

      if (inputEl && inputEl.value && inputEl.value.length > 0) {
        startNow();
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isAnswerInput(target)) return;

      const txt = e.clipboardData?.getData("text") ?? "";
      if (txt.length > 0) startNow();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Some Android/desktop environments still send keydown; treat any visible
      // character or digit as a start (we also rely on input/beforeinput).
      const target = e.target as HTMLElement | null;
      if (!isAnswerInput(target)) return;

      // Ignore control/navigation keys; start on visible characters.
      if (e.key.length === 1) startNow();
    };

    document.addEventListener("beforeinput", onBeforeInput, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("beforeinput", onBeforeInput, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [status, paused, sw.running]);
  /* ========================== END start-on-first-char ========================= */

  // Scoring
  const correctCount = useMemo(
    () =>
      steps.reduce((acc, s, i) => {
        const v = Number(answers[i]);
        return acc + (Number.isFinite(v) && v === s.answer ? 1 : 0);
      }, 0),
    [answers, steps]
  );

  // Perfect days increment when all correct
  useEffect(() => {
    if (status === "done" && steps.length > 0 && correctCount === steps.length) {
      const k = "perfectDays";
      const cur = Number(localStorage.getItem(k) || "0");
      localStorage.setItem(k, String(cur + 1));
    }
  }, [status, correctCount, steps.length]);

  // Labels & derived values for the habit row
  const modeLabel =
    mode === "hard" ? "Hard" : mode === "normal" ? "Normal" : "Easy";
  const modeKey = mode as Mode;

  // Calendar + streak + best per mode
  const { days: calDays, flags: calFlags } = useMemo(buildWeekCalendar, [status, mode]);
  const rollingStreak = useMemo(() => computeStreak(calFlags), [calFlags]);

  const streakCaption =
    rollingStreak > 0
      ? `You’re on a ${rollingStreak}-day run. Keep it going!`
      : ZERO_STREAK_MSG;

  const bestForMode = useMemo(() => loadBestForMode(modeKey), [modeKey, status]);

  /* ------------------- Mini stopwatch: visibility logic ------------------ */
  const mainTimerRef = useRef<HTMLDivElement | null>(null);
  const [isMainInView, setIsMainInView] = useState(true);

  useEffect(() => {
    const el = mainTimerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsMainInView(entry.isIntersecting),
      { root: null, threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scroll direction detector with small threshold
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
  useEffect(() => {
    let lastY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    let raf = 0;
    const THRESHOLD = 16;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y =
          window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;
        const dy = y - lastY;
        if (Math.abs(dy) > THRESHOLD) {
          setScrollDir(dy > 0 ? "down" : "up");
          lastY = y;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const miniVisible =
    status === "playing" && !paused && !isMainInView && scrollDir !== "down";

  return (
    <>
      {/* Top banner — centered title/emoji; theme selector pinned left */}
      <div className="top-banner">
        <div className="top-banner-title">
          <span className="emoji" aria-hidden="true">
            ⏱
          </span>
          MicroMath
        </div>

        <select
          aria-label="Theme"
          className="theme-picker"
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="blue">Default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <main className="app-container" key={session}>
        {/* Header with fixed height; timer hidden on Home */}
        <StickyHeader>
          <header
            className="header"
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h1
                className="brand"
                style={{ position: "static", transform: "none", marginBottom: 8 }}
              >
                MicroMath
              </h1>
              <p className="brand-subtitle" style={{ marginTop: 0, marginBottom: 0 }}>
                Your Daily Math Dealer 🙂
              </p>
            </div>

            {status !== "idle" && (
              <div
                className="header-timer"
                ref={mainTimerRef}
                aria-live="polite"
                style={{ position: "absolute", right: 0, top: 0 }}
              >
                <span className="timer-emoji" aria-hidden="true">
                  ⏱
                </span>{" "}
                {sw.formatted}
              </div>
            )}
          </header>
        </StickyHeader>

        {/* Floating mini stopwatch */}
        {status === "playing" && (
          <MiniStopwatch
            text={`⏱ ${sw.formatted}`}
            visible={miniVisible}
            onClick={() =>
              mainTimerRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
          />
        )}

{/* Tabs + Daily button */}
<div className="controls-row mode-tabs grid grid-cols-1 gap-3 justify-items-stretch sm:flex sm:flex-row sm:justify-center sm:items-center">
  <button
    onClick={() => setMode("easy")}
    aria-label="Switch to Easy mode"
    className={`w-full sm:w-auto tab mode-tab ${mode === "easy" ? "tab--active mode-tab--active" : ""}`}
  >
    Easy
  </button>

  <button
    onClick={() => setMode("normal")}
    aria-label="Switch to Normal mode"
    className={`w-full sm:w-auto tab mode-tab ${mode === "normal" ? "tab--active mode-tab--active" : ""}`}
  >
    Normal
  </button>

  <button
    onClick={() => setMode("hard")}
    aria-label="Switch to Hard mode"
    className={`w-full sm:w-auto tab mode-tab ${mode === "hard" ? "tab--active mode-tab--active" : ""}`}
  >
    Hard
  </button>

  <button
    type="button"
    className={`order-4 sm:order-none w-full sm:w-auto daily-btn ${isDaily ? "daily-btn--active" : ""}`}
    onClick={() => setIsDaily((v) => !v)}
    title="Daily gives you the same puzzle everyone today"
  >
    Daily
  </button>
</div>



        {/* Habit row: calendar (left), best pill (right), streak under calendar */}
        <div className="habit-row">
          <div className="habit-top">
            <div className="habit-days">
              <WeeklyCalendarRow days={calDays} />
              <div className="habit-streak">
                {FEATURE_STREAKS && <StreakCaption text={streakCaption} />}
              </div>
            </div>

            {status === "idle" && (
              <div className="habit-best bestpill-compact">
                <BestPill modeLabel={modeLabel} best={bestForMode} />
              </div>
            )}
          </div>
        </div>

        {/* Results strip + Share */}
        {status === "done" && (
          <div className="results card" style={{ marginTop: 12, padding: 12 }}>
            <div
              className="final-score"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span className="meta-label">FINAL SCORE</span>
              <a className="meta-value">
                {results.score}/{results.total}
              </a>
            </div>

            <ResultsShareSlot
              status={status}
              modeLabel={modeLabel}
              finalScore={results.score}
              total={results.total}
              elapsedMs={results.timeMs}
              className="mt-2"
            />
          </div>
        )}

        {/* Primary buttons row: Start on Idle; Reset on Done */}
        <div className="primary-buttons">
          {status === "idle" && (
            <button
              onClick={start}
              disabled={!canPlayToday}
              title={!canPlayToday ? "Already played today. Uncheck Daily to practice." : ""}
              className={`btn btn--primary ${!canPlayToday ? "btn--disabled" : ""}`}
            >
              {isDaily ? "Start Today's" : "Start Random"}{" "}
              {mode === "hard" ? "Hard" : mode === "normal" ? "Normal" : "Easy"}
            </button>
          )}

          {status === "done" && <ResetButton onClick={resetToHome} />}
        </div>

        {/* Already played notice */}
        {isDaily && !canPlayToday && status === "idle" && (
          <div className="notice notice--warn">
            You already played today's <strong>{mode}</strong> ladder. Turn{" "}
            <strong>Daily</strong> OFF to practice unlimited, or come back tomorrow.
          </div>
        )}

        {/* Ladder */}
        {steps.length > 0 && (
          <div className="ladder card">
            {steps.map((s, i) => {
              const val = answers[i] ?? "";
              const numeric = Number(val);
              const correct = Number.isFinite(numeric) && numeric === s.answer;
              const disabled = status !== "playing" || paused;

              const hasEqualsInPrompt = s.prompt.includes("=");

              // a11y off-screen label id
              const srId = `q${i + 1}-label`;

              return (
                <div key={i} className="ladder-row">
                  {/* Visual-only chip */}
                  <div className="index-col" aria-hidden="true">
                    <span className="index-chip">{i + 1}</span>
                  </div>

                  {/* Off-screen label for AT users */}
                  <span id={srId} className="sr-only">{`Question ${i + 1}`}</span>

                  {/* Prompt */}
                  <div className="ladder-prompt" aria-describedby={srId}>
                    {mode === "hard" ? renderPromptWithSuperscript(s.prompt) : s.prompt}
                    {!hasEqualsInPrompt ? " =" : ""}
                  </div>

                  {/* Input */}
                  <div
                    style={
                      disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined
                    }
                  >
                    <SmartNumberInput
                      value={val}
                      onChange={(raw) => {
                        if (status === "playing" && !paused && !sw.running) sw.start();

                        const next = answers.slice();
                        next[i] = raw;
                        setAnswers(next);
                      }}
                      allowDecimal={false}
                      className="answer-input"
                      disabled={disabled}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const curr = (answers[i] ?? "").trim();
                        if (!curr) return;

                        const inputs = Array.from(
                          document.querySelectorAll<HTMLInputElement>(
                            "input.answer-input, .answer-input input"
                          )
                        );
                        const nxt = inputs[i + 1];
                        if (nxt && !nxt.disabled) {
                          requestAnimationFrame(() => nxt.focus());
                        }
                      }}
                    />
                  </div>

                  <span className="result-icon">
                    {val ? (correct ? "✅" : "❌") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom actions: Submit + Pause/Resume + Reset (shown ONLY while playing) */}
        {status === "playing" && (
          <div
            className="bottom-actions"
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              justifyContent: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <button onClick={finish} className="btn btn--outline">
              Submit
            </button>
            <button
              onClick={() => {
                setPaused((p) => {
                  const next = !p;
                  if (next) sw.stop();
                  else sw.start();
                  return next;
                });
              }}
              className="btn btn--outline"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button onClick={reset} className="btn btn--outline">
              Reset
            </button>
          </div>
        )}

        {/* Instructions */}
        {status === "idle" && (
          <div
            className="rules card"
            style={{
              marginTop: 14,
              padding: 14,
              color: "#000",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            <p style={{ margin: "0 0 10px" }}>
              MicroMath is a stopwatch-based arithmetic workout. Pick a level (8
              questions), press Start, and the watch begins on your first input.
              Press Submit to stop and record your time. Goal: beat your
              personal best. Share your results with a friend.
            </p>

            <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
              <strong>Daily Button</strong>
            </h3>
            <p style={{ margin: "0 0 10px" }}>
              Tap Daily to play the same puzzle everyone gets today at your
              chosen level (Easy, Normal, or Hard). Finish and share your time
              to compare with friends.
            </p>

            <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
              <strong>How to use</strong>
            </h3>
            <ul style={{ margin: "0 0 10px 18px", padding: 0 }}>
              <li>Start where you are: pen &amp; paper welcome.</li>
              <li>
                Calculator is allowed, but try to wean off—aim for quick mental
                math.
              </li>
              <li>
                Show up daily (or as often as you can) and chip away at your
                time.
              </li>
            </ul>

            <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
              <strong>Why to use it regularly</strong>
            </h3>
            <p style={{ margin: "0 0 10px" }}>
              Short, consistent reps build number sense, speed, and confidence.
              You don’t need perfect streaks, just keep nudging your personal
              best downward.
            </p>

            <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
              <strong>Modes at a glance</strong>
            </h3>
            <ul style={{ margin: "0 0 10px 18px", padding: 0 }}>
              <li>Easy: whole numbers; + / − / ×</li>
              <li>Normal: + / − / × / ÷, slightly tougher numbers</li>
              <li>Hard: adds exponents and parentheses</li>
            </ul>

            <p style={{ margin: 0 }}>
              Ready? Tap Start, race the clock, and share your best time.
            </p>
          </div>
        )}

        <footer className="footer">
          © {new Date().getFullYear()} MicroMath
          {(() => {
            const sha = (import.meta.env.VITE_COMMIT_SHA ?? "").slice(0, 7);
            return sha ? ` · ${sha}` : "";
          })()}
        </footer>

        {/* Render results modal */}
        <InlineResultsModal
          open={results.open}
          timeMs={results.timeMs}
          score={results.score}
          total={results.total}
          perfect={results.perfect}
          message={results.message}
          onClose={() => setResults((r) => ({ ...r, open: false }))}
        />
      </main>
    </>
  );
}

// Helper: render ^ as superscript in prompts
function renderPromptWithSuperscript(text: string): ReactNode {
  const re = /(\S+)\s*\^\s*(\S+)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const match of text.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const base = match[1];
    const exp = match[2];
    parts.push(
      <span key={`pow-${k++}`}>
        {base}
        <sup>{exp}</sup>
      </span>
    );
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
