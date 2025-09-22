import { bumpStreak, getDifficulty, setPlayedToday } from "../lib/streak";
import { useEffect, useMemo, useRef, useState } from "react";
import * as gen from "../lib/generate";
import { hintFor, isCorrect } from "../lib/check";
import { useNavigate } from "react-router-dom";
import ResultsCTAs from "../components/ResultsCTAs";

export default function Play() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(60);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const diff = getDifficulty();
  // Robust pattern to handle any export name from generate module
  const generateDay = (gen as any).generate ?? (gen as any).generateDay ?? (gen as any).default;
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
    const finalScore = score + (lastOk ? 1 : 0);
    const win = finalScore >= 8 && left > 0;
    bumpStreak(diff, win);
    setPlayedToday(diff);

    // (kept from earlier code)
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
    if (k === "C") setInput("");
    else if (k === "Backspace") setInput((s) => s.slice(0, -1));
    else if (k === "Enter") submit();
    else setInput((s) => (s.length < 6 ? s + k : s));
  }

  return (
    <section className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div className="text-slate-600">
          Rung {idx + 1} / {total} • Mode: {diff}
        </div>
        <div className={`text-2xl font-bold ${left <= 10 ? "text-red-600" : ""}`}>{left}s</div>
      </div>

      <div className="mt-6 text-3xl font-mono">{rung.expr}</div>

      <div className="mt-4">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => pressKey(e.key)}
          className="w-40 rounded border p-3 text-2xl"
          inputMode="numeric"
          aria-label="Answer"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 w-40">
        {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "Backspace", "C"].map((k: string) => (
          <button
            key={k}
            onClick={() => pressKey(k)}
            className="rounded border py-2 text-sm hover:bg-slate-50"
          >
            {k === "Backspace" ? "Del" : k}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <button onClick={submit} className="rounded-md bg-blue-600 px-4 py-2 text-white">
          Submit
        </button>
      </div>
    </section>
  );
}