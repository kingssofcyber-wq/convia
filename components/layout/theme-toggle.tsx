"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <button className="icon-button" type="button" aria-label="Theme loading" />;
  const isDark = (resolvedTheme || theme) === "dark";
  return (
    <button className="icon-button" type="button" aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
