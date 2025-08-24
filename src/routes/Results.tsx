import { Link, useLocation } from "react-router-dom";
import { getStreak } from "../lib/streak";
import type { Mode } from "../lib/streak";


type ResultState = { score: number; total: number; elapsed: number; win: boolean; items: Array<{expr:string; correct:boolean; hint:string}> };

export default function Results() {
  const diff = localStorage.getItem("difficulty") || "Normal";
  const lastScore = parseInt(localStorage.getItem(`lastScore-${diff}`) || "0");
  const lastWin = localStorage.getItem(`lastWin-${diff}`) === "true";
  const streak = getStreak(diff as Mode);
  const current = streak?.current || 0;
  const best = streak?.best || 0;



const location = useLocation();
const s = (location.state as ResultState) || { score: 0, total: 10, elapsed: 60, win: false, items: [] };


  return (
    <section className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Results</h1>
      <h2 className="text-xl font-semibold">
  {lastWin ? "You won!" : "Try again tomorrow"}
</h2>

<p className="mt-2 text-gray-600">
  Final score: {lastScore}/10
</p>

<p className="mt-2 text-gray-600">
  Your {diff} streak is now: {current}
</p>

      <div className={`mt-3 rounded border p-3 ${s.win ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"}`}>
  <div className="font-medium">
    {s.win ? "You cleared the ladder." : "You missed the target."}
  </div>
  <div className="text-sm text-slate-700">
    Score {s.score} / {s.total}. Time used {s.elapsed}s.
  </div>
  <div className="text-sm text-slate-700 mt-1">
    {s.win
      ? `Streak increased. Current: ${current}. Best: ${best}.`
      : `Streak reset. Current: ${current}. Best: ${best}.`}
  </div>
</div>


      <ul className="mt-4 space-y-2">
        {s.items.map((it, i) => (
          <li key={i} className={`rounded border p-3 ${it.correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
            <div className="font-mono">{it.expr}</div>
            {!it.correct && <div className="text-sm text-slate-600">Hint: {it.hint}</div>}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded-md border px-4 py-2">Home</Link>
        <Link to="/play" className="rounded-md bg-blue-600 px-4 py-2 text-white">Play again</Link>
      </div>
    </section>
  );
}
