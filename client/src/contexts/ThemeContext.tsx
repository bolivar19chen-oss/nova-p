import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

// Clave unica de tema en toda la app. Antes convivian dos: esta usaba "theme" y
// forzaba claro con switchable=false, mientras el interruptor del panel escribia
// "petNovaTheme". El efecto de abajo corria despues y borraba la clase dark, asi
// que la preferencia del usuario se perdia en cada recarga.
const STORAGE_KEY = "petNovaTheme";

function readInitialTheme(defaultTheme: Theme): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {
    /* localStorage bloqueado, por ejemplo dentro de un iframe */
  }
  return defaultTheme;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  /** Solo indica si la interfaz ofrece el interruptor. La preferencia guardada
   *  se respeta siempre, valga lo que valga esta prop. */
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme(defaultTheme));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage bloqueado */
    }
  }, [theme]);

  // Otras partes de la app (el interruptor del header) alternan la clase y escriben
  // la misma clave directamente. Escuchamos ese cambio para no desincronizarnos y
  // volver a pisarlo en el proximo render.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme((prev) => (prev === (isDark ? "dark" : "light") ? prev : isDark ? "dark" : "light"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
