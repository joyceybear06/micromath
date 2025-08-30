import { useEffect, useState } from "react";

export type Mode = "easy" | "normal" | "hard";

const KEY = "mode";

export function useMode(): [Mode, (m: Mode) => void] {
  const initial = (() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as Mode | null;
    return (saved === "easy" || saved === "normal" || saved === "hard") ? saved : "normal";
  })();

  const [mode, setMode] = useState<Mode>(initial);

  useEffect(() => {
    try { localStorage.setItem(KEY, mode); } catch {}
  }, [mode]);

  return [mode, setMode];
}
