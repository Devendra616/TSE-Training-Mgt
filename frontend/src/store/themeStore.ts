import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Keep track of the listener to remove it when theme changes
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;
let activeMediaQuery: MediaQueryList | null = null;

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Clean up existing listener
  if (systemThemeListener && activeMediaQuery) {
    activeMediaQuery.removeEventListener('change', systemThemeListener);
    systemThemeListener = null;
    activeMediaQuery = null;
  }

  const getMediaQuery = () => {
    return window.matchMedia('(prefers-color-scheme: dark)');
  };

  const applySystemTheme = () => {
    const mq = getMediaQuery();
    const isDark = mq.matches;
    console.log('[Theme] System preference dark:', isDark);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return mq;
  };

  if (theme === 'system') {
    activeMediaQuery = applySystemTheme();
    
    // Add listener for system changes
    systemThemeListener = (e) => {
      const isDark = e.matches;
      console.log('[Theme] System preference changed to dark:', isDark);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    activeMediaQuery.addEventListener('change', systemThemeListener);
  } else {
    // Manual theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  // Wait for next tick to ensure hydration doesn't conflict
  setTimeout(() => {
    const stored = localStorage.getItem('theme-storage');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.theme) {
          applyTheme(state.theme);
        }
      } catch {
        applyTheme('system');
      }
    } else {
      applyTheme('system');
    }
  }, 0);
}

