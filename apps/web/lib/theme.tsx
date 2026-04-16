"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { storageKeys } from "./env";

type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKeys.theme) as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === "system" ? "dark" : theme;
    root.classList.remove("dark", "light");
    root.classList.add(resolved);
    window.localStorage.setItem(storageKeys.theme, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: Theme) => setThemeState(next),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return context;
}
