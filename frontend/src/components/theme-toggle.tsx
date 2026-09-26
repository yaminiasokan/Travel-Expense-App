"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative flex h-8 items-center rounded-full border border-line bg-paper-dim transition-colors ${
        compact ? "w-8 justify-center" : "w-14 px-1"
      }`}
    >
      {compact ? (
        isDark ? <Moon className="h-4 w-4 text-gold" /> : <Sun className="h-4 w-4 text-gold" />
      ) : (
        <motion.span
          layout
          className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-navy"
          animate={{ x: isDark ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {isDark ? <Moon className="h-3.5 w-3.5 text-gold" /> : <Sun className="h-3.5 w-3.5 text-gold" />}
        </motion.span>
      )}
    </button>
  );
}
