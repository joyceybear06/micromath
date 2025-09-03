import { useEffect, useState } from "react";

export type Theme = "blue" | "light" | "dark";
const THEME_KEY = "theme";

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1st visit: default to Light Blue
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "blue" || saved === "light" || saved === "dark") {
        return saved as Theme;
      }
    } catch {}
    return "blue";
  });

  useEffect(() => {
    // persist + apply to <html> and <body> for easy CSS targeting
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return [theme, setTheme];
}
