"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="relative flex items-center gap-3 p-2 w-full rounded-xl text-text-secondary hover:bg-text-primary/10 hover:text-text-primary transition-all group">
        <div className="w-6 h-6 shrink-0 opacity-0" />
      </button>
    );
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center gap-3 p-2 w-full rounded-xl text-text-secondary hover:bg-text-primary/5 hover:text-text-primary hover:shadow-sm border border-transparent hover:border-border-color transition-all duration-300 group overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
        <Sun className={`absolute w-5 h-5 text-amber-500 drop-shadow-sm transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark ? 'rotate-[180deg] scale-0 opacity-0 blur-sm' : 'rotate-0 scale-100 opacity-100 blur-0'}`} />
        <Moon className={`absolute w-5 h-5 text-indigo-500 dark:text-indigo-400 drop-shadow-sm transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isDark ? 'rotate-0 scale-100 opacity-100 blur-0' : '-rotate-[180deg] scale-0 opacity-0 blur-sm'}`} />
      </div>
      <div className="relative flex-1 text-left hidden lg:block overflow-hidden h-6">
        <span className={`absolute inset-0 flex items-center font-semibold tracking-wide transition-all duration-500 ease-out ${isDark ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>Light Mode</span>
        <span className={`absolute inset-0 flex items-center font-semibold tracking-wide transition-all duration-500 ease-out ${isDark ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>Dark Mode</span>
      </div>
    </button>
  );
}
