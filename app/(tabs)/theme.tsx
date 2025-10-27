// app/(tabs)/theme.tsx
import React, { createContext, useContext, useMemo, useState } from 'react';
import { ColorValue } from 'react-native';

// Các màu mà toàn app sẽ dùng
export type AppColors = {
  bg: ColorValue;         // nền màn hình
  card: ColorValue;       // nền thẻ / item
  text: ColorValue;       // chữ chính
  sub: ColorValue;        // chữ phụ / mô tả
  border: ColorValue;     // màu viền
  primary: ColorValue;    // màu nhấn (play button, slider track)
  pillBg: ColorValue;     // nền pill nhỏ
  pillText: ColorValue;   // chữ trên pill
  inputBg: ColorValue;    // nền ô search / input
  sliderTrack: ColorValue;
  sliderThumb: ColorValue;
};

// Giao diện sáng -> dễ nhìn để nộp bài
const LIGHT: AppColors = {
  bg: '#FFFFFF',
  card: '#F5F5F7',
  text: '#1F2937',
  sub: '#6B7280',
  border: '#E5E7EB',
  primary: '#6366F1',
  pillBg: '#E5E7EB',
  pillText: '#1F2937',
  inputBg: '#F3F4F6',
  sliderTrack: '#6366F1',
  sliderThumb: '#6366F1',
};

// Giao diện tối -> bonus toggle
const DARK: AppColors = {
  bg: '#0B1220',
  card: '#1F2537',
  text: '#FFFFFF',
  sub: '#9CA3AF',
  border: '#374151',
  primary: '#6366F1',
  pillBg: 'rgba(255,255,255,0.08)',
  pillText: '#FFFFFF',
  inputBg: 'rgba(255,255,255,0.08)',
  sliderTrack: '#6366F1',
  sliderThumb: '#6366F1',
};

type ThemeContextType = {
  colors: AppColors;
  isDark: boolean;
  toggleTheme: () => void;
};

// Tạo context
const ThemeCtx = createContext<ThemeContextType | undefined>(undefined);

// Provider bọc toàn bộ navigator/tabs
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // default: LIGHT để app sáng
  const [isDark, setIsDark] = useState(false);

  const colors = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const value = useMemo(
    () => ({
      colors,
      isDark,
      toggleTheme,
    }),
    [colors, isDark]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// Hook để dùng trong screen
export function useAppTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error('useAppTheme phải được dùng bên trong <ThemeProvider>');
  }
  return ctx;
}
