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


export default function App() {
  const [mode, setMode] = useMode();
  const [status, setStatus] = useState<Status>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  const [showScorePopup, setShowScorePopup] = useState<boolean>(false);

  // Confetti (perfect only)
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ left: number; delay: number; bg: string; deg: number; duration: number }>
  >([]);

  // --- NEW: rotating encouragement message state/ref -------------------------
  const [encMessage, setEncMessage] = useState<string>("");
  const lastEncIdxRef = useRef<number | null>(null);

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
    } else {
      ladder = isDaily ? generateLadderForSeed(mode, seed) : generateLadder(mode);
    }

    setSteps(ladder);
    setAnswers(Array(ladder.length).fill(""));
    setTimeLeft(60);
    setShowScorePopup(false);
    setShowConfetti(false);
    setStatus("playing");
  };

  const finish = () => {
    setStatus("done");
    if (isDaily) localStorage.setItem(playedKey, "1");
  };

  const reset = () => {
    setStatus("idle");
    setSteps([]);
    setAnswers([]);
    setTimeLeft(60);
    setShowScorePopup(false);
    setShowConfetti(false);
  };

  // Countdown ----------------------------------------------------------------
  useEffect(() => {
    if (status !== "playing") return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timeLeft]);

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

  // Final-score popup (perfect lasts 9s, others 6s) + confetti (perfect)
  useEffect(() => {
    if (status !== "done") return;

    const perfect = steps.length > 0 && correctCount === steps.length;
    setShowScorePopup(true);

    // --- NEW: pick a rotating encouragement for non-perfect runs -------------
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

    const popupDuration = perfect ? 9000 : 6000; // +3s for perfect
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

  // Render ^ as superscript in prompts (display-only; answers unchanged)
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
      // If user cancels share, do nothing
    }
  };

  const isPerfectRun = status === "done" && steps.length > 0 && correctCount === steps.length;
  const currentStreak = Number(localStorage.getItem("perfectDays") || "0");
  const streakDisplay = isPerfectRun ? currentStreak + 1 : currentStreak;

  return (
    <>
      {/* Top banner */}
      <div className="top-banner">⏱ MicroMath — 60-second daily ladder</div>

      <main className="app-container">
        {/* Header: brand centered via CSS, timer pinned right via CSS */}
        <header className="header">
          <h1 className="brand">MicroMath</h1>
          <div
            className={
              "header-timer" +
              (status === "playing" && timeLeft <= 10 ? " danger" : "")
            }
            aria-live="polite"
          >
            ⏱ {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
          </div>
        </header>

        {/* Tabs + Daily toggle */}
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
              {mode === "hard" ? "Hard" : mode === "normal" ? "Normal" : "Easy"} (60s)
            </button>
          )}

          {status === "playing" && (
            <button onClick={finish} className="btn btn--outline">
              Finish Early
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
                    {mode === "hard"
                      ? renderPromptWithSuperscript(s.prompt)
                      : s.prompt}
                    {!hasEqualsInPrompt ? " =" : ""}
                  </div>

                  {/* iPhone-friendly numeric input allowing '-' */}
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    enterKeyHint="done"
                    disabled={disabled}
                    value={val}
                    onChange={(e) => {
                      let raw = e.target.value;
                      raw = raw.replace(/[–—−]/g, "-").replace(",", ".");
                      raw = raw
                        .replace(/[^0-9.\-]/g, "")
                        .replace(/(?!^)-/g, "")
                        .replace(/(\..*)\./g, "$1");
                      const next = answers.slice();
                      next[i] = raw;
                      setAnswers(next);
                    }}
                    className="answer-input"
                  />

                  <span className="result-icon">
                    {val ? (correct ? "✅" : "❌") : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions (emoji only on section headings) */}
        {status === "idle" && (
          <div className="rules card">
            <h2>📘 How it works</h2>
            <ul>
              <li>
                Choose <strong>Easy</strong> ({EASY_COUNT}), <strong>Normal</strong> ({NORMAL_COUNT}), or{" "}
                <strong>Hard</strong> ({HARD_COUNT}).
              </li>
              <li>
                Press <strong>Start</strong> and solve as many as you can in <strong>⏱ 60 seconds</strong>.
              </li>
              <li>
                You’ll see <strong>✅</strong> for correct and <strong>❌</strong> for incorrect as you type.
              </li>
            </ul>

            <h3>📅 About “Daily”</h3>
            <p className="rules-paragraph">
              When <strong>Daily</strong> is ON, today’s date + mode generates <strong>the same ladder for everyone</strong>.
              One play per mode per day.
            </p>
            <p className="rules-paragraph">
              Turn <strong>Daily OFF</strong> for unlimited practice (fresh random ladders).
            </p>

            <h3>✨ Extras</h3>
            <ul>
              <li><strong>Easy</strong>: whole numbers only, + − × ÷.</li>
              <li><strong>Normal</strong>: head-math friendly + − × ÷.</li>
              <li><strong>Hard</strong>: + − × ÷, ^, parentheses — still mental-math sized.</li>
              <li>Perfect day = no wrong answers.</li>
            </ul>
          </div>
        )}

        {/* PERFECT popup (bigger & longer) vs regular final-score popup */}
        {showScorePopup && status === "done" && steps.length > 0 && (
          isPerfectRun ? (
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
                  <button className="btn btn--outline" onClick={handleShare}>Share</button>
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

                {/* NEW: encouragement line for non-perfect */}
                <div className="rules-paragraph" style={{ textAlign: "center", marginTop: 6 }}>
                  {encMessage}
                </div>
              </div>
            </div>
          )
        )}

        {/* Confetti overlay (only on perfect) */}
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
                  transform: `rotate(${p.deg}deg)`
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
