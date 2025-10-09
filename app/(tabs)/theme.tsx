// app/(tabs)/theme.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Palette = {
  bgFrom: string;
  bgTo: string;
  text: string;
  sub: string;
  primary: string;
  accent: string;
  warn: string;
  card: string;
  input: string;
};

export const colorsDark: Palette = {
  bgFrom: '#0b1220',
  bgTo: '#111827',
  text: '#ffffff',
  sub: '#94a3b8',
  primary: '#6366f1',
  accent: '#10b981',
  warn: '#f59e0b',
  card: '#ffffff10',
  input: '#ffffff12',
};

export const colorsLight: Palette = {
  bgFrom: '#f7fafc',
  bgTo: '#ffffff',
  text: '#0b1220',
  sub: '#475569',
  primary: '#4f46e5',
  accent: '#059669',
  warn: '#b45309',
  card: '#00000010',
  input: '#00000010',
};

// ✅ Giữ export này để các file cũ vẫn chạy (dark mặc định)
export const colors = colorsDark;

type Ctx = {
  isDark: boolean;
  colors: Palette;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: 'dark' | 'light') => Promise<void>;
};

const THEME_KEY = 'ui:theme';
const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light') setIsDark(false);
        if (saved === 'dark') setIsDark(true);
      } catch {}
    })();
  }, []);

  const setTheme = async (mode: 'dark' | 'light') => {
    setIsDark(mode === 'dark');
    await AsyncStorage.setItem(THEME_KEY, mode);
  };

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const value = useMemo<Ctx>(() => ({
    isDark,
    colors: isDark ? colorsDark : colorsLight,
    toggleTheme,
    setTheme,
  }), [isDark]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useAppTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useAppTheme must be used inside <ThemeProvider>');
  return ctx;
}
