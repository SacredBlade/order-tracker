"use client";

// Light / dark mode button. The choice is saved in the browser (localStorage)
// so it sticks next time. The actual colours for each mode live in
// src/app/globals.css (search for [data-theme="dark"]).
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Read whatever theme the inline script (in layout.tsx) already applied.
  useEffect(() => {
    const current = (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore if storage is blocked
    }
    setTheme(next);
  }

  return (
    <button
      className="btn btn-outline btn-md"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}
