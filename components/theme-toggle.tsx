"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return (
    <button
      onClick={() => {
        const root = document.documentElement;
        const next = root.classList.contains("dark") ? "light" : "dark";
        root.classList.toggle("dark", next === "dark");
        localStorage.setItem("theme", next);
      }}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}