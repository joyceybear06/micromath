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
  const newStreak = getStreak(diff);
  setStreak(newStreak);
}, [diff]);


  function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const d = e.target.value as "easy" | "normal";
    setDiffState(d);
    setDifficulty(d);
  }

  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Micromath</h1>
      <p className="mt-2 text-slate-600">60 second daily arithmetic ladder. 10 rungs.</p>

      <div className="mt-3 text-sm text-slate-600">Date: {today()}</div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-slate-600" htmlFor="diff">Difficulty</label>
        <select id="diff" value={diff} onChange={change} className="rounded border px-2 py-1">
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
        </select>
        <span className="text-slate-700">Streak: {streak.current} 
          {streak.best}  
</span>
      </div>

      <div className="mt-6">
        <Link
          to={played ? "/results" : "/play"}
          className={`rounded-md px-4 py-2 text-white ${played ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600"}`}
          aria-disabled={played}
        >
          {played ? "Played today. See results" : "Play Today"}
        </Link>
      </div>
    </section>
    
  );
}
