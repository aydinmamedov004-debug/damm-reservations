"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("damm-theme", next ? "dark" : "light");
    } catch {
      /* localStorage unavailable — theme just won't persist */
    }
  }

  // Avoid rendering a possibly-wrong icon before we've read the DOM class.
  if (dark === null) {
    return <span className={`inline-block h-9 w-9 ${className}`} aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4.2" />
          <path
            strokeLinecap="round"
            d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.55 1.55M17.55 17.55l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.55-1.55M17.55 6.45l1.55-1.55"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.7 6.7 0 0 0 10.7 10.7Z"
          />
        </svg>
      )}
    </button>
  );
}
