import { useState, useEffect } from 'react';

function getInitialDark(): boolean {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitialDark);

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  return {
    isDark,
    toggle: () => setIsDark((d) => !d),
  };
}
