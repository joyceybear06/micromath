// src/routes/Results.tsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResultsCTAs from "../components/ResultsCTAs";

type ResultItem = { expr: string; correct: boolean; hint: string };

type ResultsState = {
  score: number;
  total: number;
  elapsed: number; // seconds
  win: boolean;
  items: ResultItem[];
};

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsState | undefined;

  // Guard direct hits to /results
  useEffect(() => {
    if (!state || typeof state.score !== "number" || typeof state.total !== "number") {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const { score, total, elapsed, win, items } = state;

  return (
    <section className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Results</h1>
        <div className={`text-sm ${win ? "text-green-700" : "text-slate-600"}`}>
          {win ? "Win" : "Completed"}
        </div>
      </header>

      <div className="mt-3 text-slate-700">
        <div className="text-lg">
          Score: <span className="font-semibold">{score}</span> / {total}
        </div>
        <div className="text-sm">Time: {elapsed}s</div>
      </div>

      {/* Optional quick list */}
      <div className="mt-6">
        <ul className="space-y-2">
          {items?.slice(0, 5).map((it, i) => (
            <li key={i} className="rounded border p-2">
              <div className="font-mono text-base">{it.expr}</div>
              <div className="text-sm">
                {it.correct ? "✅ Correct" : "❌ Incorrect"} • Hint: {it.hint}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Habit CTAs */}
      <div className="mt-8">
        <ResultsCTAs
          mode="easy"                 // safe default for now
          score={score}
          elapsedMs={elapsed * 1000}  // convert seconds → ms for ShareButton
        />
      </div>
    </section>
  );
}
