import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMode } from "./hooks/useMode";
import {
  generateLadder,
  generateLadderForSeed,
  NORMAL_COUNT,
  HARD_COUNT,
} from "./logic/generator";
import { generateEasy, generateEasyForSeed, EASY_COUNT } from "./logic/easy";
import type { Step } from "./types";
import "./App.css";

/* Timer & iOS-safe input */
import Timer from "./components/Timer";
import SmartNumberInput from "./components/SmartNumberInput";
import { useTheme, type Theme } from "./hooks/useTheme"; // theme hook

type Status = "idle" | "playing" | "done";

const pad = (n: number) => n.toString().padStart(2, "0");
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Rotating encouragements for NON-perfect runs (exact phrase + one emoji) */
const ENCOURAGEMENTS = [
  "You're close—Keep Going! 🌟",
  "Almost there—Push Through! 💪",
  "Nice effort—Try Again! 🚀",
  "So close—One More Go! 🎯",
  "Good work—Finish Strong! 🔁",
];

const HARD_PLUS_15_KEY = "hardPlus15"; // persistence key

export default function App() {
  const [mode, setMode] = useMode();
  const [status, setStatus] = useState<Status>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  const [showScorePopup, setShowScorePopup] = useState<boolean>(false);

  // THEME (persisted)
  const [theme, setTheme] = useTheme();

  // Confetti (perfect only)
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ left: number; delay: number; bg: string; deg: number; duration: number }>
  >([]);

  // encouragement
  const [encMessage, setEncMessage] = useState<string>("");
  const lastEncIdxRef = useRef<number | null>(null);

  // drift-proof timer refs
  const endAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  // Hard +15s user choice (persists)
  const [hardPlus15, setHardPlus15] = useState<boolean>(() => {
    try {
      return localStorage.getItem(HARD_PLUS_15_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(HARD_PLUS_15_KEY, hardPlus15 ? "1" : "0");
    } catch {}
  }, [hardPlus15]);

  // Daily seed + played-today key
  const seed = `${mode}-${todayKey()}`;
  const playedKey = `played:${seed}`;
  const canPlayToday = !isDaily || !localStorage.getItem(playedKey);

  // Helper: total seconds for this run (60, or 75 if Hard + toggle ON)
  const totalSeconds = 60 + (mode === "hard" && hardPlus15 ? 15 : 0);

  // ---------------------- NEW: refs & helpers for ± and focus ----------------------
  // Keep refs to each answer input so we can focus after toggling ±
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const toggleSignAt = (idx: number) => {
    setAnswers((prev) => {
      const next = prev.slice();
      const cur = (next[idx] ?? "").replace(/[–—−]/g, "-"); // normalize exotic minus
      if (cur.startsWith("-")) {
        next[idx] = cur.slice(1); // remove minus
      } else {
        next[idx] = cur.length ? `-${cur.replace(/^-/, "")}` : "-"; // add minus or start with "-"
      }
      return next;
    });

    // Put focus back and move caret to the end
    requestAnimationFrame(() => {
      const el = inputRefs.current[idx];
      if (el) {
        el.focus();
        try {
          const l = el.value.length;
          el.setSelectionRange(l, l);
        } catch {}
      }
    });
  };
  // -------------------------------------------------------------------------------

  // Start / Finish / Reset ----------------------------------------------------
  const start = () => {
    if (!canPlayToday) return;

    let ladder: Step[];
    if (mode === "easy") {
      ladder = isDaily ? generateEasyForSeed(seed) : generateEasy();
    } else {
      ladder = isDaily ? generateLadderForSeed(mode, seed) : generateLadder(mode);
    }

    setSteps(ladder);
    setAnswers(Array(ladder.length).fill(""));
    setTimeLeft(totalSeconds);
    setShowScorePopup(false);
    setShowConfetti(false);
    setStatus("playing");

    // drift-proof ticker using a fixed deadline
    endAtRef.current = performance.now() + totalSeconds * 1000;
    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const sync = () => {
      if (endAtRef.current == null) return;
      const ms = endAtRef.current - performance.now();
      const secs = Math.max(0, Math.ceil(ms / 1000));
      setTimeLeft(secs);
    };
    tickRef.current = window.setInterval(sync, 200);
    sync();
    document.addEventListener("visibilitychange", sync, { passive: true });
  };

  const finish = () => {
    setStatus("done");
    if (isDaily) localStorage.setItem(playedKey, "1");

    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    endAtRef.current = null;
  };

  const reset = () => {
    setStatus("idle");
    setSteps([]);
    setAnswers([]);
    setTimeLeft(60 + (mode === "hard" && hardPlus15 ? 15 : 0));
    setShowScorePopup(false);
    setShowConfetti(false);

    if (tickRef.current != null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    endAtRef.current = null;
  };

  // finish when time hits zero
  useEffect(() => {
    if (status === "playing" && timeLeft <= 0) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timeLeft]);

  // Let CSS know when a round is running (for mobile timer positioning)
  useEffect(() => {
    const v = status === "playing" ? "1" : "0";
    document.body.setAttribute("data-playing", v);
    return () => {
      document.body.removeAttribute("data-playing");
    };
  }, [status]);

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

  // Final-score popup + confetti
  useEffect(() => {
    if (status !== "done") return;

    const perfect = steps.length > 0 && correctCount === steps.length;
    setShowScorePopup(true);

    if (!perfect) {
      const len = ENCOURAGEMENTS.length;
      let idx = Math.floor(Math.random() * len);
      if (lastEncIdxRef.current !== null && len > 1) {
        while (idx === lastEncIdxRef.current) {
          idx = Math.floor(Math.random() * len);
        }
      }
      lastEncIdxRef.current = idx;
      setEncMessage(ENCOURAGEMENTS[idx]);
    }

    let confettiTimer: number | undefined;
    if (perfect) {
      const colors = ["#2563EB", "#16A34A", "#F59E0B", "#EF4444", "#10B981", "#3B82F6"];
      const pieces = Array.from({ length: 80 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        bg: colors[Math.floor(Math.random() * colors.length)],
        deg: Math.random() * 360,
        duration: 2.3 + Math.random() * 0.8,
      }));
      setConfettiPieces(pieces);
      setShowConfetti(true);
      confettiTimer = window.setTimeout(() => setShowConfetti(false), 2800);
    }

    const popupDuration = perfect ? 9000 : 6000;
    const popupTimer = window.setTimeout(() => setShowScorePopup(false), popupDuration);

    return () => {
      if (confettiTimer) clearTimeout(confettiTimer);
      clearTimeout(popupTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  // Share handler (perfect only)
  const handleShare = async () => {
    const modeLabel = mode === "hard" ? "Hard" : mode === "normal" ? "Normal" : "Easy";
    const url = window.location.href;
    const text = `MicroMath — I got a PERFECT score in ${modeLabel} (${isDaily ? "Daily" : "Practice"})! Try it: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "MicroMath", text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Link copied!");
      }
    } catch {
      // user cancelled
    }
  };

  const isPerfectRun = status === "done" && steps.length > 0 && correctCount === steps.length;
  const currentStreak = Number(localStorage.getItem("perfectDays") || "0");
  const streakDisplay = isPerfectRun ? currentStreak + 1 : currentStreak;

  /* ---------------------- ENTER → Next logic ---------------------- */
  const getAnswerInputs = () =>
    Array.from(
      document.querySelectorAll<HTMLInputElement>("input.answer-input, .answer-input input")
    );

  const handleAnswerKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "Enter") return;

    // Don’t submit forms / don’t beep
    e.preventDefault();

    // If empty, stay here
    const val = (answers[idx] ?? "").trim();
    if (!val) return;

    // If there is a next input, focus it. Otherwise do nothing (user can click "End").
    const inputs = getAnswerInputs();
    const next = inputs[idx + 1];
    if (next && !next.disabled) {
      requestAnimationFrame(() => next.focus());
    }
  };
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Top banner (centered title, picker on far right) */}
      <div className="top-banner">
        <div className="top-banner-title">⏱ MicroMath — 60-second daily ladder</div>

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
        {/* Header */}
        <header className="header">
          <h1 className="brand">MicroMath</h1>
          <div
            className={
              "header-timer" + (status === "playing" && timeLeft <= 10 ? " danger" : "")
            }
            aria-live="polite"
          >
            ⏱{" "}
            <Timer
              durationMs={totalSeconds * 1000}
              running={status === "playing"}
              onExpire={finish}
              format="mm:ss"
            />
          </div>
        </header>

        {/* Tabs + Daily toggle + +15s toggle */}
        <div className="controls-row">
          <button
            onClick={() => setMode("easy")}
            className={`tab ${mode === "easy" ? "tab--active" : ""}`}
          >
            Easy ({EASY_COUNT} steps)
          </button>

          <button
            onClick={() => setMode("normal")}
            className={`tab ${mode === "normal" ? "tab--active" : ""}`}
          >
            Normal ({NORMAL_COUNT} steps)
          </button>

          <button
            onClick={() => setMode("hard")}
            className={`tab ${mode === "hard" ? "tab--active" : ""}`}
          >
            Hard ({HARD_COUNT} steps)
          </button>

          <label className="daily-toggle">
            <input
              type="checkbox"
              checked={isDaily}
              onChange={(e) => setIsDaily(e.target.checked)}
            />
            <span>Daily</span>
          </label>

          {mode === "hard" && status !== "playing" && (
            <label className="daily-toggle" title="Optional: adds 15 seconds to Hard mode">
              <input
                type="checkbox"
                checked={hardPlus15}
                onChange={(e) => setHardPlus15(e.target.checked)}
              />
              <span>Additional 15 seconds</span>
            </label>
          )}
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
              {isDaily ? "Start Today’s" : "Start Random"}{" "}
              {mode === "hard" ? "Hard" : mode === "normal" ? "Normal" : "Easy"} ({totalSeconds}s)
            </button>
          )}

          {status === "playing" && (
            <button onClick={finish} className="btn btn--outline">
              End
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
            You already played today’s <strong>{mode}</strong> ladder. Turn{" "}
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
              const disabled = status !== "playing" || timeLeft <= 0;

              const hasEqualsInPrompt = s.prompt.includes("=");

              return (
                <div key={i} className="ladder-row">
                  <div className="ladder-prompt">
                    {i + 1}.{" "}
                    {mode === "hard" ? renderPromptWithSuperscript(s.prompt) : s.prompt}
                    {!hasEqualsInPrompt ? " =" : ""}
                  </div>

                  <div style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}>
                    {/* ± button for iOS users to enter negative numbers */}
                    <button
                      type="button"
                      aria-label="Toggle negative sign"
                      onClick={() => toggleSignAt(i)}
                      disabled={disabled}
                      style={{
                        width: 36,
                        height: 36,
                        marginRight: 8,
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--text)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        lineHeight: 1,
                        userSelect: "none",
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      ±
                    </button>

                    <SmartNumberInput
                      ref={(el) => { inputRefs.current[i] = el; }}  // ← return void
                      value={val}
                      onChange={(raw) => {
                        const next = answers.slice();
                        next[i] = raw;
                        setAnswers(next);
                      }}
                      allowDecimal={false}
                      className="answer-input"
                      // Enter → next (no change)
                      onKeyDown={(e: any) => handleAnswerKeyDown(e, i)}
                    />
                  </div>

                  <span className="result-icon">{val ? (correct ? "✅" : "❌") : ""}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        {status === "idle" && (
          <div className="rules card">
            <h2>📘 How it works</h2>
            <ul>
              <li>
                Select <strong>Easy</strong> ({EASY_COUNT}), <strong>Normal</strong> ({NORMAL_COUNT}), or{" "}
                <strong>Hard</strong> ({HARD_COUNT}).
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

        {/* PERFECT popup */}
        {showScorePopup && status === "done" && steps.length > 0 && (isPerfectRun ? (
          <div className={`score-popup long`} role="alert" aria-live="assertive">
            <div className="score-popup-card perfect">
              <div className="score-title">Perfect Score 🎉</div>
              <div className="score-value-big">
                {correctCount}/{steps.length}
              </div>
              <div className="rules-paragraph" style={{ textAlign: "center", marginTop: 4 }}>
                Streak: <strong>{streakDisplay}</strong> day{streakDisplay === 1 ? "" : "s"}
              </div>
              <div className="popup-actions">
                <button className="btn btn--outline" onClick={handleShare}>
                  Share
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="score-popup" role="alert" aria-live="assertive">
            <div className="score-popup-card">
              <div className="score-title">Final score</div>
              <div className="score-value-big">
                {correctCount}/{steps.length}
              </div>
              <div className="rules-paragraph" style={{ textAlign: "center", marginTop: 6 }}>
                {encMessage}
              </div>
            </div>
          </div>
        ))}

        {/* Confetti */}
        {showConfetti && (
          <div className="confetti" aria-hidden="true">
            {confettiPieces.map((p, idx) => (
              <span
                key={idx}
                className="piece"
                style={{
                  left: `${p.left}%`,
                  background: p.bg,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  transform: `rotate(${p.deg}deg)`,
                }}
              />
            ))}
          </div>
        )}

        <footer className="footer">© {new Date().getFullYear()} MicroMath</footer>
      </main>
    </>
  );
}
