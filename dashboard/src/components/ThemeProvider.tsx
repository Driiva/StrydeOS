"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent | MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

const STORAGE_KEY = "strydeos-app-theme";
const WIPE_DURATION = 500;

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable
  }
  return "light";
}

interface WipeState {
  nextTheme: Theme;
  x: number;
  y: number;
}

function WipeOverlay({ wipe, onDone }: { wipe: WipeState; onDone: () => void }) {
  const bg = wipe.nextTheme === "dark" ? "#0B2545" : "#F2F1EE";

  return createPortal(
    <div
      className="theme-wipe-overlay"
      onAnimationEnd={onDone}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        background: bg,
        "--wipe-x": `${wipe.x}px`,
        "--wipe-y": `${wipe.y}px`,
      } as React.CSSProperties}
    />,
    document.body
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [wipe, setWipe] = useState<WipeState | null>(null);
  const wipeActive = useRef(false);

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme, applyTheme]);

  const toggleTheme = useCallback((e?: React.MouseEvent | MouseEvent) => {
    if (wipeActive.current) return;

    const nextTheme: Theme = theme === "light" ? "dark" : "light";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !e) {
      setTheme(nextTheme);
      return;
    }

    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top + rect.height / 2 : e.clientY;

    wipeActive.current = true;
    setWipe({ nextTheme, x, y });
  }, [theme]);

  const handleWipeDone = useCallback(() => {
    if (!wipe) return;
    setTheme(wipe.nextTheme);
    setWipe(null);
    wipeActive.current = false;
  }, [wipe]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        toggleTheme();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {wipe && <WipeOverlay wipe={wipe} onDone={handleWipeDone} />}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
