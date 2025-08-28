// src/App.tsx
import { useEffect, useMemo, useState } from 'react';
import { useMode } from './hooks/useMode';
import { generateLadder, generateLadderForSeed } from './logic/generator';
import type { Step } from './types';

type Status = 'idle' | 'playing' | 'done';

const pad = (n: number) => n.toString().padStart(2, '0');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function App() {
  const [mode, setMode] = useMode(); // tuple from the hook
  const [status, setStatus] = useState<Status>('idle');
  const [steps, setSteps] = useState<Step[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDaily, setIsDaily] = useState<boolean>(true); // Daily ON by default

  const seed = `${mode}-${todayKey()}`;             // e.g. hard-2025-08-28
  const playedKey = `played:${seed}`;
  const canPlayToday = !isDaily || !localStorage.getItem(playedKey);

  const start = () => {
    if (!canPlayToday) return;
    const ladder = isDaily ? generateLadderForSeed(mode, seed) : generateLadder(mode);
    setSteps(ladder);
    setAnswers(Array(ladder.length).fill(''));
    setTimeLeft(60);
    setStatus('playing');
  };

  const finish = () => {
    setStatus('done');
    if (isDaily) localStorage.setItem(playedKey, '1'); // lock Daily for today (per mode)
  };

  // 60s countdown with auto-finish
  useEffect(() => {
    if (status !== 'playing') return;
    if (timeLeft <= 0) {
      finish();
      return;
    }
    const id = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timeLeft]);

  // live correctness counter
  const correctCount = useMemo(
    () =>
      steps.reduce((acc, s, i) => {
        const v = Number(answers[i]);
        return acc + (Number.isFinite(v) && v === s.answer ? 1 : 0);
      }, 0),
    [answers, steps]
  );

  const reset = () => {
    setStatus('idle');
    setSteps([]);
    setAnswers([]);
    setTimeLeft(60);
  };

  return (
    <div style={{ maxWidth: 780, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8, textAlign: 'center' }}>MicroMath</h1>

      {/* Mode + Daily row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={() => setMode('normal')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: mode === 'normal' ? '2px solid #000' : '1px solid #ccc',
            background: mode === 'normal' ? '#e6f0ff' : '#fff',
            cursor: 'pointer'
          }}
        >
          Normal (5 steps)
        </button>

        <button
          onClick={() => setMode('hard')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: mode === 'hard' ? '2px solid #000' : '1px solid #ccc',
            background: mode === 'hard' ? '#cfe0ff' : '#fff',
            cursor: 'pointer'
          }}
        >
          Hard (10 steps)
        </button>

        <label style={{ marginLeft: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={isDaily}
            onChange={(e) => setIsDaily(e.target.checked)}
          />
          Daily
        </label>

        <div style={{ marginLeft: 'auto', fontWeight: 600 }}>
          ⏱ {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {status !== 'playing' && (
          <button
            onClick={start}
            disabled={!canPlayToday}
            title={!canPlayToday ? 'Already played today. Uncheck Daily to practice.' : ''}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #0a7',
              background: canPlayToday ? '#19c37d' : '#bcd',
              color: '#fff',
              cursor: canPlayToday ? 'pointer' : 'not-allowed'
            }}
          >
            Start {isDaily ? 'Today’s' : 'Random'} {mode === 'hard' ? 'Hard' : 'Normal'} Mode (60s)
          </button>
        )}

        {status === 'playing' && (
          <button
            onClick={finish}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Finish Early
          </button>
        )}

        {(status === 'done' || status === 'idle') && (
          <button
            onClick={reset}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Already played notice */}
      {isDaily && !canPlayToday && status === 'idle' && (
        <div style={{ marginBottom: 12, color: '#b00' }}>
          You already played today’s {mode} ladder. Uncheck <strong>Daily</strong> to practice,
          or come back tomorrow.
        </div>
      )}

      {/* Ladder */}
      {steps.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {steps.map((s, i) => {
            const val = answers[i] ?? '';
            const numeric = Number(val);
            const correct = Number.isFinite(numeric) && numeric === s.answer;
            const disabled = status !== 'playing' || timeLeft <= 0;

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 260, fontSize: 18 }}>{i + 1}. {s.prompt} =</div>
                <input
                  inputMode="numeric"
                  disabled={disabled}
                  value={val}
                  onChange={(e) => {
                    const next = answers.slice();
                    next[i] = e.target.value.trim();
                    setAnswers(next);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    fontSize: 16,
                    width: 140,
                    background: disabled ? '#f6f6f6' : '#fff'
                  }}
                />
                <span style={{ minWidth: 80 }}>
                  {val.length > 0 ? (correct ? '✅' : '❌') : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {steps.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Final Score:</strong> {correctCount}/{steps.length}
          {status === 'done' && (timeLeft <= 0 ? ' — TIME UP!' : ' — Finished')}
        </div>
      )}

      {/* Help text */}
      {status === 'idle' && (
        <div style={{ marginTop: 16, color: '#333' }}>
          <p><strong>Normal:</strong> 5 steps with +, −, ×, ÷</p>
          <p><strong>Hard:</strong> 10 steps with +, −, ×, ÷, ^ and parentheses</p>
          <p>Daily uses today’s date + mode to create the same ladder for everyone. Turn it off to practice unlimited.</p>
        </div>
      )}
    </div>
  );
}
