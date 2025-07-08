import { useCallback, useEffect, useState } from "react";

/**
 * useDarkMode – lightweight dark-mode controller.
 *
 * Priority for initial theme:
 *   1. explicit value in localStorage ('dark' | 'light')
 *   2. system preference via prefers-color-scheme media query
 *   3. fallback to "light"
 *
 * The hook keeps the <html> element in sync and persists the choice to localStorage.
 * It exposes:
 *   isDark   – boolean                   – current theme flag
 *   toggle   – () => void                – invert the theme
 *   mounted  – boolean                   – `true` once the hook has run on the client
 */
export function useDarkMode(): [boolean, () => void, boolean] {
  const getInitialTheme = (): "dark" | "light" => {
    if (typeof window === "undefined") return "light";

    try {
      const stored = window.localStorage.getItem("theme") as "dark" | "light" | null;
      if (stored === "dark" || stored === "light") return stored;
    } catch {
      /* swallow */
    }

    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [isDark, setIsDark] = useState<boolean>(() => getInitialTheme() === "dark");
  const [mounted, setMounted] = useState(false);

  // Keep <html> class and localStorage in sync whenever isDark changes.
  useEffect(() => {
    if (!mounted) return; // Skip initial run until mounted=true to avoid SSR mismatch

    const classList = document.documentElement.classList;
    const bodyClassList = document.body.classList;

    if (isDark) {
      classList.add("dark");
      bodyClassList.add("dark");
    } else {
      classList.remove("dark");
      bodyClassList.remove("dark");
    }

    try {
      window.localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [isDark, mounted]);

  // Mark mounted after first client render and ensure DOM classes are correct.
  useEffect(() => {
    // On mount, ensure DOM and state are aligned (may differ if user changed system theme).
    const initialTheme = getInitialTheme();
    setIsDark(initialTheme === "dark");

    // Align DOM immediately to avoid flash.
    const classList = document.documentElement.classList;
    const bodyClassList = document.body.classList;
    if (initialTheme === "dark") {
      classList.add("dark");
      bodyClassList.add("dark");
    } else {
      classList.remove("dark");
      bodyClassList.remove("dark");
    }

    setMounted(true);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return [isDark, toggleDark, mounted];
} 