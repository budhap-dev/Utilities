import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'contrast', label: 'High contrast' },
];

const ThemeContext = createContext({ theme: 'system', setTheme: () => {}, resolved: 'light' });
const STORAGE_KEY = 'devkit.theme';

function systemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  });
  const [resolved, setResolved] = useState(() => (theme === 'system' ? systemTheme() : theme));

  useEffect(() => {
    const apply = () => {
      const r = theme === 'system' ? systemTheme() : theme;
      setResolved(r);
      document.documentElement.setAttribute('data-theme', r);
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (t) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(() => ({ theme, setTheme, resolved }), [theme, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
