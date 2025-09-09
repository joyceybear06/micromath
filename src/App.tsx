import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";  
import { useMode } from "./hooks/useMode";
import { generateLadder, generateLadderForSeed } from "./logic/generator";
import { generateEasy, generateEasyForSeed } from "./logic/easy";
import type { Step } from "./types";
import "./App.css";

/* Stopwatch & iOS-safe input */
import { useStopwatch } from "./hooks/useStopwatch";
import SmartNumberInput from "./components/SmartNumberInput";
import { useTheme, type Theme } from "./hooks/useTheme";

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
  const shareText = useMemo(
    () => `I just finished MicroMath — Score ${score}/${total} in ${fmtTime(timeMs)}!`,
    [score, total, timeMs]
  );

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
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${shareText}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Copied results to clipboard!");
      } else {
        prompt("Copy your results:", text);
      }
    } catch {}
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
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          padding: 20,
          border: "2px solid #e9d5ff",
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
          <p style={{ marginTop: 6, marginBottom: 10, color: "#374151" }}>
            {message ?? "Nice effort—keep going!"}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={onShare}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
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

/* ------------------------- MiniStopwatch (existing) ----------------------- */
function MiniStopwatch({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button
      className="mini-stopwatch"
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

  // ensure the theme attribute is on <body> (so light palette applies globally)
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

  // Render ^ as superscript in prompts
  const renderPromptWithSuperscript = (text: string): ReactNode => {
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
  };

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

  const showMini = status === "playing" && !isMainInView;
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
              Daily brain warm-up.
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

        {/* Floating mini stopwatch (mobile) */}
        {showMini && (
          <MiniStopwatch
            text={`⏱ ${sw.formatted}`}
            onClick={() =>
              mainTimerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          />
        )}

        {/* Tabs + Daily toggle */}
        <div className="controls-row">
          <button
            onClick={() => setMode("easy")}
            className={`tab ${mode === "easy" ? "tab--active" : ""}`}
          >
            Easy (8 questions)
          </button>

          <button
            onClick={() => setMode("normal")}
            className={`tab ${mode === "normal" ? "tab--active" : ""}`}
          >
            Normal (8 questions)
          </button>

          <button
            onClick={() => setMode("hard")}
            className={`tab ${mode === "hard" ? "tab--active" : ""}`}
          >
            Hard (8 questions)
          </button>

          <button
            type="button"
            className={`daily-btn ${isDaily ? "daily-btn--active" : ""}`}
            onClick={() => setIsDaily((v) => !v)}
            title="Daily = same puzzle as everyone today. Practice = random puzzles."
            aria-pressed={isDaily}
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

          {status === "done" && steps.length > 0 && (
            <div className="meta-item score">
              <span className="meta-label">Final score</span>
              <span className="meta-value score-value">
                {correctCount}/{steps.length}
              </span>
            </div>
          )}
        </div>

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

              return (
                <div key={i} className="ladder-row">
                  {/* --- ACCESSIBLE NUMBER CHIP --- */}
                  <span className="num-col" aria-hidden="true">
                    <span className="num-chip">{i + 1}</span>
                  </span>
                  <span className="sr-only">Question {i + 1}</span>

                  {/* Prompt (NO "1." prefix anymore) */}
                  <div className="ladder-prompt">
                    {mode === "hard" ? renderPromptWithSuperscript(s.prompt) : s.prompt}
                    {!hasEqualsInPrompt ? " =" : ""}
                  </div>

                  {/* Answer input */}
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

        {/* Instructions */}
        {status === "idle" && (
          <div className="rules card">
            <h2>📘 How it works</h2>
            <ul>
              <li>
                Select <strong>Easy</strong> (8), <strong>Normal</strong> (8), or{" "}
                <strong>Hard</strong> (8).
              </li>
              <li>
                Press <strong>Start</strong>. You have <strong>60 seconds</strong> to answer as many as you can.
              </li>
              <li>
                <strong>Hard only:</strong> before you start, you can enable <strong>Additional 15 seconds</strong>.
                When ON, Hard runs for <strong>75 seconds</strong> instead of 60.
              </li>
              <li>Each answer is checked instantly.</li>
            </ul>

            <h3>📅 About Daily</h3>
            <p className="rules-paragraph">
              With <strong>Daily</strong> ON, everyone gets the same puzzle for that day (one play per mode).
            </p>
            <p className="rules-paragraph">Turn it OFF for unlimited practice with new random puzzles.</p>

            <h3>Modes at a glance</h3>
            <ul>
              <li>
                <strong>Easy</strong>: whole numbers; + − × ÷.
              </li>
              <li>
                <strong>Normal</strong>: same operations with slightly tougher numbers.
              </li>
              <li>
                <strong>Hard</strong>: adds exponents (^) and parentheses.
              </li>
            </ul>
          </div>
        )}

        <footer className="footer">© {new Date().getFullYear()} MicroMath</footer>

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
