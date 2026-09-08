import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getThemeMode, setThemeMode as saveThemeMode, ThemeMode } from './mmkv';

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  card: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  accentText: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  statusBar: 'light' | 'dark';
}

const darkColors: ThemeColors = {
  isDark: true,
  background: '#0d120f',
  surface: '#141e17',
  surfaceSubtle: '#18231c',
  surfaceElevated: '#1a261f',
  card: '#141e17',
  border: '#202e25',
  borderSubtle: '#1c2820',
  textPrimary: '#faf9f5',
  textSecondary: '#78a898',
  textMuted: '#5c7a6e',
  accent: '#f5b800',
  accentBg: '#22251a',
  accentText: '#141413',
  danger: '#ff7b72',
  dangerBg: '#2d1818',
  success: '#5db872',
  successBg: '#18261e',
  statusBar: 'light',
};

const lightColors: ThemeColors = {
  isDark: false,
  background: '#f8f6f0',
  surface: '#ffffff',
  surfaceSubtle: '#f0ede4',
  surfaceElevated: '#ffffff',
  card: '#ffffff',
  border: '#e4dfd3',
  borderSubtle: '#ebe7de',
  textPrimary: '#1a1f1b',
  textSecondary: '#5a6d62',
  textMuted: '#88988d',
  accent: '#d49400',
  accentBg: '#fef7e6',
  accentText: '#ffffff',
  danger: '#e04f4f',
  dangerBg: '#fdeeed',
  success: '#2e8c45',
  successBg: '#edf8f0',
  statusBar: 'dark',
};

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'dark',
  setThemeMode: () => {},
  colors: darkColors,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getThemeMode());

  useEffect(() => {
    const saved = getThemeMode();
    if (saved !== themeMode) {
      setThemeModeState(saved);
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    saveThemeMode(mode);
  };

  const isDark = useMemo(() => {
    if (themeMode === 'light') return false;
    if (themeMode === 'dark') return true;
    return systemColorScheme === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      <StatusBar style={colors.statusBar} />
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
