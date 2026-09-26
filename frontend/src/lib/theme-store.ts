"use client";

import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  hydrated: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "waypoint.theme";

function applyThemeClass(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  hydrated: false,

  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    applyThemeClass(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const theme: Theme = stored ?? (prefersDark ? "dark" : "light");
    applyThemeClass(theme);
    set({ theme, hydrated: true });
  },
}));
