import { useEffect, useState } from 'react';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const { theme: storeTheme, setTheme } = useThemeStore();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (storeTheme !== 'system') {
      setResolvedTheme(storeTheme);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [storeTheme]);

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return { theme: resolvedTheme, toggleTheme };
}
