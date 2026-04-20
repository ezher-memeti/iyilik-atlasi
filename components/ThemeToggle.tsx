"use client";

import { useEffect } from "react";
import common from "@/content/common.json";

const storageKey = "kurban-theme";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return "dark";
}

export function ThemeToggle() {
  useEffect(() => {
    const theme = getInitialTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    const nextTheme = isDark ? "dark" : "light";
    window.localStorage.setItem(storageKey, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={common.labels.toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-900/10 bg-white text-sm font-semibold text-emerald-950 shadow-sm transition hover:border-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-white/10 dark:bg-emerald-950 dark:text-emerald-50 dark:hover:border-emerald-400 dark:hover:text-emerald-200 dark:focus:ring-offset-slate-950"
    >
      <span aria-hidden="true" className="dark:hidden">
        ☾
      </span>
      <span aria-hidden="true" className="hidden dark:inline">
        ☀
      </span>
    </button>
  );
}
