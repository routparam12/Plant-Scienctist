import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme } from '../types';

const THEME_STORAGE_KEY = 'plant_scientist_theme';

interface ThemeColors {
  bg: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  inputBg: string;
  primary: string;
  primaryDark: string;
  accentBg: string;
  headerBg: string;
  pillBg: string;
  cardAltBg: string;
}

const LIGHT_COLORS: ThemeColors = {
  bg: '#F7F9F5',
  card: '#FFFFFF',
  cardBorder: '#E2E8DE',
  textPrimary: '#1A1C18',
  textSecondary: '#556052',
  textMuted: '#889584',
  border: '#E2E8DE',
  inputBg: '#F7F9F5',
  primary: '#0D6832',
  primaryDark: '#084822',
  accentBg: '#E8F5E9',
  headerBg: '#FFFFFF',
  pillBg: '#EBF1E6',
  cardAltBg: '#F4F7F2',
};

const DARK_COLORS: ThemeColors = {
  bg: '#121512',
  card: '#1C201C',
  cardBorder: '#2C352B',
  textPrimary: '#ECF3EB',
  textSecondary: '#A2B29F',
  textMuted: '#728270',
  border: '#2C352B',
  inputBg: '#222822',
  primary: '#16A34A',
  primaryDark: '#0D6832',
  accentBg: '#1A3320',
  headerBg: '#1A1D1A',
  pillBg: '#252D24',
  cardAltBg: '#181C18',
};

interface ThemeContextType {
  theme: AppTheme; // Selected setting: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'; // Effective theme: 'light' or 'dark'
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  isDark: false,
  setTheme: () => {},
  colors: LIGHT_COLORS,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme(); // 'light' | 'dark' | null | undefined
  const [theme, setThemeState] = useState<AppTheme>('system');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeState(savedTheme);
      } else {
        setThemeState('system');
      }
    } catch {
      setThemeState('system');
    }
  };

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  };

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme;

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
