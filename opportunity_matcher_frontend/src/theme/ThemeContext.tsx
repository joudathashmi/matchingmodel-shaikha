import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

export type ThemeMode = "dark";

const STORAGE_KEY = "rhq.settings.theme";

type ThemeContextValue = {
  theme: ThemeMode;
  darkMode: boolean;
  setTheme: (mode: ThemeMode) => void;
  setDarkMode: (enabled: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDomTheme() {
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  root.style.colorScheme = "dark";
  try {
    localStorage.setItem(STORAGE_KEY, "dark");
  } catch {
    /* ignore */
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    applyDomTheme();
  }, []);

  const setTheme = useCallback((_mode: ThemeMode) => {
    applyDomTheme();
  }, []);

  const setDarkMode = useCallback((_enabled: boolean) => {
    applyDomTheme();
  }, []);

  const toggleTheme = useCallback(() => {
    applyDomTheme();
  }, []);

  const value = useMemo(
    () => ({
      theme: "dark" as const,
      darkMode: true,
      setTheme,
      setDarkMode,
      toggleTheme,
    }),
    [setTheme, setDarkMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
