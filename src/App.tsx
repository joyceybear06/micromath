import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMode } from "./hooks/useMode";
import {
  generateLadder,
  generateLadderForSeed,
  NORMAL_COUNT,
  HARD_COUNT,
} from "./logic/generator";
import type { Step } from "./types";
import "./App.css";

type Status = "idle" | "playing" | "done";

const pad = (n: number) => n.toString().padStart(2, "0");
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function App() {
  const [mode, setMode] = useMode();
  const [status, setStatus] = useState<Status>("idle");
  const [steps, setSteps] = useState<Step[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDaily, setIsDaily] = useState<boolean>(true);
  const [showScorePopup, setShowScorePopup] = useState<boolean>(false);

  // Daily seed + played-today key
  const seed = `${mode}-${todayKey()}`;
  const playedKey = `played:${seed}`;
  const canPlayToday = !isDaily || !localStorage.getItem(playedKey);

  // Start / Finish / Reset ----------------------------------------------------
  const start = () => {
    if (!canPlayToday) return;
    const ladder = isDaily
      ? generateLadderForSeed(mode, seed)
      : generateLadder(mode);
    setSteps(ladder);
    setAnswers(Array(ladder.length).fill(""));
    setTimeLeft(60);
    setShowScorePopup(false);
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

  // Final-score popup (~6s)
  useEffect(() => {
    if (status === "done") {
      setShowScorePopup(true);
      const t = setTimeout(() => setShowScorePopup(false), 6000);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Meta values --------------------------------------------------------------
  const perfectDays = Number(localStorage.getItem("perfectDays") || "0");
  const statusChip = isDaily
    ? `Daily Mode: ${canPlayToday ? "Not Completed Today" : "Completed for Today"}`
    : "Practice Mode";

  // Render ^ as superscript in prompts (display-only; answers unchanged)
  const renderPromptWithSuperscript = (text: string): ReactNode => {
    // matches "base ^ exp" or "base^exp"
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
              title={
                !canPlayToday ? "Already played today. Uncheck Daily to practice." : ""
              }
              className={`btn btn--primary ${!canPlayToday ? "btn--disabled" : ""}`}
            >
              {isDaily ? "Start Today’s" : "Start Random"}{" "}
              {mode === "hard" ? "Hard" : "Normal"} (60s)
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

              // Only append "=" if prompt doesn't already contain one
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
                  <input
                    inputMode="numeric"
                    disabled={disabled}
                    value={val}
                    onChange={(e) => {
                      const next = answers.slice();
                      next[i] = e.target.value.trim();
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
                Choose <strong>Normal</strong> ({NORMAL_COUNT}) or{" "}
                <strong>Hard</strong> ({HARD_COUNT}).
              </li>
              <li>
                Press <strong>Start</strong> and solve as many as you can in{" "}
                <strong>⏱ 60 seconds</strong>.
              </li>
              <li>
                You’ll see <strong>✅</strong> for correct and{" "}
                <strong>❌</strong> for incorrect as you type.
              </li>
            </ul>

            <h3>📅 About “Daily”</h3>
            <p className="rules-paragraph">
              When <strong>Daily</strong> is ON, today’s date + mode generates{" "}
              <strong>the same ladder for everyone</strong>. One play per mode per day.
            </p>
            <p className="rules-paragraph">
              Turn <strong>Daily OFF</strong> for unlimited practice (fresh random
              ladders).
            </p>

            <h3>✨ Extras</h3>
            <ul>
              <li>
                <strong>Normal</strong>: +, −, ×, ÷ — head-math friendly.
              </li>
              <li>
                <strong>Hard</strong>: +, −, ×, ÷, ^, parentheses — spicier but still
                mental-math sized.
              </li>
              <li>Perfect day = no wrong answers.</li>
            </ul>
          </div>
        )}

        {/* Final-score popup (~6s) */}
        {showScorePopup && status === "done" && steps.length > 0 && (
          <div className="score-popup" role="alert" aria-live="assertive">
            <div className="score-popup-card">
              <div className="score-title">Final score</div>
              <div className="score-value-big">
                {correctCount}/{steps.length}
              </div>
            </div>
          </div>
        )}

        <footer className="footer">© {new Date().getFullYear()} MicroMath</footer>
      </main>
    </>
  );
}
