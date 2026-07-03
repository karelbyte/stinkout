"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function getSnapshot(): Theme {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem("theme");
  if (v === "light" || v === "dark") return v;
  return "dark";
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, (): Theme => "dark");

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
    window.dispatchEvent(new Event("storage"));
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
