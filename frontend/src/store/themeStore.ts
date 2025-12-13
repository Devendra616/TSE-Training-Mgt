import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export const THEME_COLORS = [
  { name: 'Blue', value: '#106EBE' },
  { name: 'Mint', value: '#0FFCBE' },
  { name: 'Bright Red', value: '#E7473C' },
  { name: 'Turquoise', value: '#178582' },
  { name: 'Dark Classic Blue', value: '#0A1828' },
  { name: 'Royal Blue', value: '#002349' },
  { name: 'Tyrian Purple', value: '#4F0341' },
  { name: 'Orange', value: '#FFAB00' },
] as const;

interface ThemeState {
  theme: Theme;
  primaryColor: string;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      primaryColor: '#106EBE', // Default Blue
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setPrimaryColor: (color) => {
        set({ primaryColor: color });
        applyPrimaryColor(color);
      }
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          applyPrimaryColor(state.primaryColor);
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

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Generate shades for the color
function applyPrimaryColor(hex: string) {
  const root = document.documentElement;
  const rgb = hexToRgb(hex);
  if (!rgb) return;

  // Simple shade generation logic (can be improved with libraries like 'color')
  // For now, we will use css variables to manipulate opacity or mix with black/white
  // But strictly following the existing Tailwind palette requires 50-950.
  // We will try to generate somewhat reasonable approximations using HSL logic or just tint manipulation.
  
  // Actually, to keep it simple and robust without extra heavy deps, we can just set base color
  // and maybe a few key variants if the styling relies on them.
  // Looking at index.css, it defines --color-primary-50 to 950. 
  
  // We'll define a quick helper to mix color with white/black
  const mix = (c1: {r:number, g:number, b:number}, c2: {r:number, g:number, b:number}, weight: number) => {
      const w = weight / 100;
      return {
          r: Math.round(c1.r * (1 - w) + c2.r * w),
          g: Math.round(c1.g * (1 - w) + c2.g * w),
          b: Math.round(c1.b * (1 - w) + c2.b * w)
      };
  };

  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const base = rgb;

  const shades = {
      50: mix(base, white, 95),
      100: mix(base, white, 90),
      200: mix(base, white, 75),
      300: mix(base, white, 60),
      400: mix(base, white, 30),
      500: base, // Base color
      600: mix(base, black, 10),
      700: mix(base, black, 30),
      800: mix(base, black, 50),
      900: mix(base, black, 70),
      950: mix(base, black, 85),
  };

  Object.entries(shades).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, `#${value.r.toString(16).padStart(2, '0')}${value.g.toString(16).padStart(2, '0')}${value.b.toString(16).padStart(2, '0')}`);
  });
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
        if (state?.primaryColor) {
          applyPrimaryColor(state.primaryColor);
        }
      } catch {
        applyTheme('system');
        applyPrimaryColor('#106EBE');
      }
    } else {
      applyTheme('system');
      applyPrimaryColor('#106EBE');
    }
  }, 0);
}

