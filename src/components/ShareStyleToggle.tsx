// src/components/ShareStyleToggle.tsx
type Props = {
  className?: string;
};

const KEY = "mm_shareStyle";

export default function ShareStyleToggle({ className = "" }: Props) {
  // read once; avoid React state on purpose (simple and durable)
  const current = (localStorage.getItem(KEY) as "A" | "B") || "B";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = (e.target.value as "A" | "B") || "B";
    localStorage.setItem(KEY, v);
    // tiny UX nudge: quick confirm without pulling in a toast
    console.log(`Share style set to ${v}`);
  }

  return (
    <label className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="opacity-70">Share style</span>
      <select
        aria-label="Share style"
        defaultValue={current}
        onChange={onChange}
        className="px-2 py-1 rounded border"
      >
        <option value="B">Stopwatch line</option>
        <option value="A">Emoji line</option>
      </select>
    </label>
  );
}
