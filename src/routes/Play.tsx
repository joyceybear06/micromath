import { bumpStreak, getDifficulty, setPlayedToday } from "../lib/streak";
import { useEffect, useMemo, useRef, useState } from "react";
import * as gen from "../lib/generate";
import { hintFor, isCorrect } from "../lib/check";
import { useNavigate } from "react-router-dom";
import ResultsCTAs from "../components/ResultsCTAs";

// NEW: text-only, drift-proof stopwatch (NOT "Timer")
import Stopwatch from "../components/Stopwatch";
import { useStopwatch } from "../hooks/useStopwatch";

export default function Play() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(60);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Add stopwatch hook directly (like in App.tsx)
  const sw = useStopwatch();

  const diff = getDifficulty();
  const generateDay =
    (gen as any).generate ?? (gen as any).generateDay ?? (gen as any).default;
  const day = useMemo(() => generateDay(new Date(), diff), [diff]);
  const total = day.rungs.length;
  const rung = day.rungs[idx];

  useEffect(() => {
    inputRef.current?.focus();
  }, [idx]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [done]);

  useEffect(() => {
    if (left === 0 && !done) finish();
  }, [left, done]);

  // CRITICAL FIX: Setup event listener immediately, not dependent on state
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't start if already done or already running
      if (done || sw.running) return;

      // Only process numeric keys
      if (!/^[0-9]$/.test(e.key)) return;

      const target = e.target as HTMLElement | null;
      const isAnswerInput =
        !!target &&
        (target.classList?.contains("answer-input") ||
          target === inputRef.current ||
          (target.closest && !!target.closest(".answer-input")));

      if (!isAnswerInput) return;

      // Start stopwatch IMMEDIATELY
      console.log('🚀 Starting stopwatch on keystroke:', e.key);
      sw.start();
    };

    // Attach listener immediately when component mounts
    document.addEventListener("keydown", handler, { capture: true });
    
    return () => {
      document.removeEventListener("keydown", handler, true);
    };
  }, []); // EMPTY DEPS - attach once and leave attached

  // Secondary effect to handle state changes if needed
  useEffect(() => {
    if (done && sw.running) {
      sw.stop();
    }
  }, [done, sw.running, sw.stop]);

  function submit() {
    if (done) return;
    const ok = isCorrect(input, rung);
    if (ok) setScore((s) => s + 1);
    setInput("");
    if (idx + 1 < total) setIdx((i) => i + 1);
    else finish(ok);
  }

  function finish(lastOk?: boolean) {
    setDone(true);
    
    // Stop the stopwatch when game ends
    sw.stop();
    
    const finalScore = score + (lastOk ? 1 : 0);
    const win = finalScore >= 8 && left > 0;
    bumpStreak(diff, win);
    setPlayedToday(diff);

    // (kept from earlier code) — unchanged per your request
    bumpStreak(diff, true);  // if they win
    bumpStreak(diff, false); // if they lose

    const items = day.rungs.map((r: any, i: number) => ({
      expr: r.expr,
      correct: i < idx ? true : i === idx ? !!lastOk : false,
      hint: hintFor(r),
    }));

    navigate("/results", {
      state: { score: finalScore, total, elapsed: 60 - left, win, items },
    });
  }

  function pressKey(k: string) {
    // Start stopwatch IMMEDIATELY on virtual keyboard press
    if (/^[0-9]$/.test(k) && !sw.running && !done) {
      console.log('🚀 Starting stopwatch on virtual key:', k);
      sw.start();
    }

    if (k === "C") setInput("");
    else if (k === "Backspace") setInput((s) => s.slice(0, -1));
    else if (k === "Enter") submit();
    else setInput((s) => (s.length < 6 ? s + k : s));
  }

  // Visual stopwatch runs only while the game is active.
  // This does NOT affect your countdown ("left").
  const isActive = !done && left > 0;

  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div className="text-slate-600">
          Rung {idx + 1} / {total} • Mode: {diff}
        </div>
        <div className={`text-2xl font-bold ${left <= 10 ? "text-red-600" : ""}`}>
          {left}s
        </div>
      </div>

      {/* NEW: numeric stopwatch, right-aligned under header */}
      <div className="mt-2 flex justify-end">
        <Stopwatch running={isActive} />
        {/* Debug info - shows clean mm:ss format and running state */}
        <div style={{ fontSize: '10px', marginLeft: '8px', opacity: 0.5 }}>
          {sw.running ? '▶️ RUN' : '⏸️ STOP'}
        </div>
      </div>

      <div className="mt-6 text-3xl font-mono">{rung.expr}</div>

      <div className="mt-4">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            const newValue = e.target.value.replace(/\D/g, "");
            setInput(newValue);
            
            // Start stopwatch on input change (backup method for mobile/paste)
            if (newValue && newValue.length > input.length && !sw.running && !done) {
              console.log('🚀 Starting stopwatch on input change:', newValue);
              sw.start();
            }
          }}
          onKeyDown={(e) => {
            // Handle virtual keyboard
            pressKey(e.key);
          }}
          className="w-40 rounded border p-3 text-2xl answer-input"
          inputMode="numeric"
          aria-label="Answer"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 w-40">
        {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "Backspace", "C"].map(
          (k: string) => (
            <button
              key={k}
              onClick={() => pressKey(k)}
              className="rounded border py-2 text-sm hover:bg-slate-50"
            >
              {k === "Backspace" ? "Del" : k}
            </button>
          )
        )}
      </div>

      <div className="mt-6">
        <button onClick={submit} className="rounded-md bg-blue-600 px-4 py-2 text-white">
          Submit
        </button>
      </div>
    </section>
  );
}