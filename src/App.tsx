import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"; 
import { useMode } from "./hooks/useMode";
import { generateLadder, generateLadderForSeed } from "./logic/generator";
import { generateEasy, generateEasyForSeed } from "./logic/easy";
import type { Step } from "./types";
import ResultsShareSlot from "./components/ResultsShareSlot";
import { shareResult } from "./utils/share";
import "./App.css";

/* Stopwatch & iOS-safe input */
import { useStopwatch } from "./hooks/useStopwatch";
import SmartNumberInput from "./components/SmartNumberInput";
import { useTheme, type Theme } from "./hooks/useTheme";

/* NEW: sticky header wrapper */
import StickyHeader from "./components/StickyHeader";

type Status = "idle" | "playing" | "done";

const pad = (n: number) => n.toString().padStart(2, "0");
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Rotating encouragements for NON-perfect runs */
const ENCOURAGEMENTS = [
  "You're close—Keep Going! 🌟",
  "Almost there—Push Through! 💪",
  "Nice effort—Try Again! 🚀",
  "So close—One More Go! 🎯",
  "Good work—Finish Strong! 🔁",
];

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


  // Detect Dark by reading your existing attribute on <body>
  const isDark =
    typeof document !== "undefined" &&
    (document.body.getAttribute("data-theme") === "dark" ||
      document.body.classList.contains("dark") ||
      document.documentElement.classList.contains("dark"));

  // Panel colors (Light vs Dark)
  const panelBg = isDark ? "#1f2937" : "#ffffff";
  const panelBorder = isDark ? "#334155" : "#e5e7eb";
  const panelText = isDark ? "#f8fafc" : "#111827";

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
      } catch {
        /* optional */
      }
    })();
    return () => {
      canceled = true;
    };
  }, [open, perfect]);

const onShare = async () => {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  await shareResult({
    appName: "MicroMath",
    // You can pass your mode label here if you have it in scope; otherwise omit it
    // modeLabel,
    score,
    total,
    elapsedMs: timeMs,
    // extra: `🔥 Streak ${s.streak} · ❄️ ${s.freeze}`, // (optional when you wire streaks)
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
          <p style={{ marginTop: 6, marginBottom: 10, color: isDark ? "#e5e7eb" : "#374151" }}>
            {message ?? "Nice effort—keep going!"}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
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

  // ensure the theme attribute is on <body> (so light/dark palettes apply globally)
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
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

  // Start / Finish / Reset ----------------------------------------------------
  const start = () => {
    if (!canPlayToday) return;

    let ladder: Step[];
    if (mode === "easy") {
      ladder = isDaily ? generateEasyForSeed(seed) : generateEasy();

      // EASY ONLY: remove ÷ and TOP-UP to 8 questions (Daily & Practice)
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

    // Reset stopwatch to 0:00 until the first keystroke
    sw.reset();
  };

  const finish = () => {
    setStatus("done");
    if (isDaily) localStorage.setItem(playedKey, "1");

    sw.stop();

    const score = steps.length
      ? steps.reduce((acc, s, i) => acc + (Number(answers[i]) === s.answer ? 1 : 0), 0)
      : 0;
    const perfect = steps.length > 0 && score === steps.length;

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
    const v = status === "playing" ? "1" : "0";
    document.body.setAttribute("data-playing", v);
    return () => {
      document.body.removeAttribute("data-playing");
    };
  }, [status]);

  // Global keydown listener to start stopwatch on FIRST keystroke
  useEffect(() => {
    if (status !== "playing" || paused || sw.running) return;

    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inAnswer =
        !!t &&
        (t.classList?.contains("answer-input") ||
          (t.closest && !!t.closest(".answer-input")));
      if (!inAnswer) return;

      if (/^[0-9+\-*/^().]$/.test(e.key)) {
        sw.start();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [status, paused, sw]);

  // Scoring ------------------------------------------------------------------
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

  // Meta values --------------------------------------------------------------
  const perfectDays = Number(localStorage.getItem("perfectDays") || "0");
  const statusChip = isDaily
    ? `Daily Mode: ${canPlayToday ? "Not Completed Today" : "Completed for Today"}`
    : "Practice Mode";

  // NEW: human-readable label for the Share card
  const modeLabel = mode === "hard" ? "Hard" : mode === "normal" ? "Normal" : "Easy";

  /* ---------------------- ENTER → focus next input ---------------------- */
  const handleAnswerKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const val = (answers[idx] ?? "").trim();
    if (!val) return;

    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        "input.answer-input, .answer-input input"
      )
    );
    const next = inputs[idx + 1];
    if (next && !next.disabled) {
      requestAnimationFrame(() => next.focus());
    }
  };
  /* --------------------------------------------------------------------- */

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

  // Scroll direction detector with small threshold (prevents micro-flicker)
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
  useEffect(() => {
    let lastY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    let raf = 0;
    const THRESHOLD = 16; // px

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

  // Visible only when: playing, not paused, header timer is off-screen AND last direction wasn't down
  const miniVisible =
    status === "playing" && !paused && !isMainInView && scrollDir !== "down";
  /* ---------------------------------------------------------------------- */

  return (
    <>
      {/* Top banner (centered title, picker on far right) */}
      <div className="top-banner">
        <div className="top-banner-title">⏱ MicroMath </div>

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

      <main className="app-container">
        {/* Header: title + subtitle centered; timer on the right */}
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
              <h1 className="brand" style={{ position: "static", transform: "none", marginBottom: 8 }}>
                MicroMath
              </h1>
              <p className="brand-subtitle" style={{ marginTop: 0, marginBottom: 0 }}>
                Your Daily Math Dealer 🙂
              </p>
            </div>

            <div
              className="header-timer"
              ref={mainTimerRef}
              aria-live="polite"
              style={{ position: "absolute", right: 0, top: 0 }}
            >
              ⏱ {sw.formatted}
            </div>
          </header>
        </StickyHeader>

        {/* Floating mini stopwatch (always mounted in Playing; animated show/hide) */}
        {status === "playing" && (
          <MiniStopwatch
            text={`⏱ ${sw.formatted}`}
            visible={miniVisible}
            onClick={() =>
              mainTimerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          />
        )}

        {/* Tabs + Daily button */}
        <div className="controls-row mode-tabs">
          <button
            onClick={() => setMode("easy")}
            className={`tab mode-tab ${mode === "easy" ? "tab--active mode-tab--active" : ""}`}
          >
            Easy (8 questions)
          </button>

          <button
            onClick={() => setMode("normal")}
            className={`tab mode-tab ${mode === "normal" ? "tab--active mode-tab--active" : ""}`}
          >
            Normal (8 questions)
          </button>

          <button
            onClick={() => setMode("hard")}
            className={`tab mode-tab ${mode === "hard" ? "tab--active mode-tab--active" : ""}`}
          >
            Hard (8 questions)
          </button>

          <button
            type="button"
            className={`daily-btn ${isDaily ? "daily-btn--active" : ""}`}
            onClick={() => setIsDaily((v) => !v)}
            title="Daily gives you the same puzzle as everyone today"
          >
            Daily
          </button>
        </div>

        {/* Meta bar */}
        <div className="meta-bar">
          <div className="meta-item">
            <span className="meta-label">Perfect days</span>
            <span className="meta-value">{perfectDays}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Status</span>
            <span className="meta-value">{statusChip}</span>
          </div>
        </div> {/* <-- close meta bar */}

        {/* Results strip + Share (after any finish) */}
        {status === "done" && (
          <div className="results card" style={{ marginTop: 12, padding: 12 }}>
            <div className="final-score" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="meta-label">FINAL SCORE</span>
              <a className="meta-value">{results.score}/{results.total}</a>
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

        {/* Buttons */}
        <div className="primary-buttons">
          {status !== "playing" && (
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

          {(status === "done" || status === "idle") && (
            <button onClick={reset} className="btn btn--outline">
              Reset
            </button>
          )}
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
                  <div style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}>
                    <SmartNumberInput
                      value={val}
                      onChange={(raw) => {
                        // Start stopwatch on first character typed
                        if (status === "playing" && !paused && !sw.running) sw.start();

                        const next = answers.slice();
                        next[i] = raw;
                        setAnswers(next);
                      }}
                      allowDecimal={false}
                      className="answer-input"
                      disabled={disabled}
                      onKeyDown={(e) => handleAnswerKeyDown(e, i)}
                    />
                  </div>

                  <span className="result-icon">{val ? (correct ? "✅" : "❌") : ""}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom actions: Submit + Pause/Resume */}
        {status === "playing" && (
          <div
            className="bottom-actions"
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              justifyContent: "flex-start",
            }}
          >
            <button onClick={finish} className="btn btn--outline">Submit</button>
            <button
              onClick={() => {
                setPaused((p) => {
                  const next = !p;
                  if (next) sw.stop(); else sw.start();
                  return next;
                });
              }}
              className="btn btn--outline"
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        )}
        {/* Big + / − pad (Android only) */}



        {/* Instructions */}
        {status === "idle" && (
  <div
    className="rules card"
    style={{
      marginTop: 14,
      padding: 14,
      color: "#000",          // all body text black (simple, clean)
      lineHeight: 1.6,
      fontWeight: 400,        // normal weight everywhere by default
    }}
  >
    {/* Intro (plain body text, no bold) */}
    <p style={{ margin: "0 0 10px" }}>
      MicroMath is a stopwatch-based arithmetic workout. Pick a level (8 questions), press
      Start, and the watch begins on your first input. Press Submit to stop and record your time.
      Goal: beat your personal best. Share your results with a friend.
    </p>

    {/* Daily button (bold heading ONLY) */}
    <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
      <strong>Daily Button</strong>
    </h3>
    <p style={{ margin: "0 0 10px" }}>
      Tap Daily to play the same puzzle everyone gets today at your chosen level (Easy, Normal, or Hard).
      Finish and share your time to compare with friends.
    </p>

    {/* How to use (bold heading ONLY) */}
    <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
      <strong>How to use</strong>
    </h3>
    <ul style={{ margin: "0 0 10px 18px", padding: 0 }}>
      <li>Start where you are: pen &amp; paper welcome.</li>
      <li>Calculator is allowed, but try to wean off—aim for quick mental math.</li>
      <li>Show up daily (or as often as you can) and chip away at your time.</li>
    </ul>

    {/* Why to use it regularly (bold heading ONLY) */}
    <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
      <strong>Why to use it regularly</strong>
    </h3>
    <p style={{ margin: "0 0 10px" }}>
      Short, consistent reps build number sense, speed, and confidence. You don’t need perfect streaks, just keep
      nudging your personal best downward.
    </p>

    {/* Modes at a glance (bold heading ONLY) */}
    <h3 style={{ margin: "12px 0 6px", fontWeight: 700 }}>
      <strong>Modes at a glance</strong>
    </h3>
    <ul style={{ margin: "0 0 10px 18px", padding: 0 }}>
      <li>Easy: whole numbers; + / − / ×</li>
      <li>Normal: + / − / × / ÷, slightly tougher numbers</li>
      <li>Hard: adds exponents and parentheses</li>
    </ul>

    {/* Closing line (plain) */}
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
