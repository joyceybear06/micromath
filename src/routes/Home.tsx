import { Link } from "react-router-dom";
import { getStreak, getDifficulty, setDifficulty, hasPlayedToday } from "../lib/streak";
import { useEffect, useMemo, useState } from "react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [diff, setDiffState] = useState(getDifficulty());
  const [streak, setStreak] = useState<{ current: number; best: number }>({ current: 0, best: 0 });
  const played = useMemo(() => hasPlayedToday(diff), [diff]);

  useEffect(() => {
    const s = getStreak(diff);
    setStreak(s);
  }, [diff]);

  function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const d = e.target.value as "easy" | "normal"; // keep types aligned with your streak lib
    setDiffState(d);
    setDifficulty(d);
  }

  return (
    <section className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 pt-6 text-center">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">MicroMath</h1>
          <p className="text-sm opacity-80">60-second daily arithmetic ladder. 10 rungs.</p>
          <div className="text-xs opacity-70">Date: {today()}</div>
        </header>

        {/* Difficulty row */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <label htmlFor="diff" className="text-sm opacity-80">
            Difficulty
          </label>
          <select
            id="diff"
            value={diff}
            onChange={change}
            className="rounded-full border px-4 py-2 text-base w-full max-w-[220px] sm:w-auto"
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        {/* Streak copy */}
        <p className="text-sm opacity-90">
          You're on a <span className="font-semibold">{streak.current}-day</span> run. Best:{" "}
          <span className="font-semibold">{streak.best}</span>
        </p>

        {/* Primary CTA */}
        <div>
          <Link
            to={played ? "/results" : "/play"}
            className={`inline-flex w-full sm:w-auto items-center justify-center rounded-xl px-5 py-3 font-medium text-white ${
              played ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            aria-disabled={played}
          >
            {played ? "Played today. See results" : "Start Today's Puzzle"}
          </Link>
        </div>
      </div>
    </section>
  );
}
