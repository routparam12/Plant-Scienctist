import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme } from '../types';

const THEME_STORAGE_KEY = 'plant_scientist_theme';

export interface ThemeColors {
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
  onPrimary: string;
  accentBg: string;
  headerBg: string;
  pillBg: string;
  cardAltBg: string;
  toolkitDoctorBg: string;
  toolkitDoctorIcon: string;
  toolkitSoilBg: string;
  toolkitSoilIcon: string;
  toolkitMapBg: string;
  toolkitMapIcon: string;
  toolkitExpertBg: string;
  toolkitExpertIcon: string;
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
  onPrimary: '#FFFFFF',
  accentBg: '#E8F5E9',
  headerBg: '#FFFFFF',
  pillBg: '#EBF1E6',
  cardAltBg: '#F4F7F2',
  toolkitDoctorBg: '#E8F5E9',
  toolkitDoctorIcon: '#0D6832',
  toolkitSoilBg: '#FEF3C7',
  toolkitSoilIcon: '#D97706',
  toolkitMapBg: '#DBEAFE',
  toolkitMapIcon: '#2563EB',
  toolkitExpertBg: '#F3E8FF',
  toolkitExpertIcon: '#9333EA',
};

const DARK_COLORS: ThemeColors = {
  bg: '#0E1511',
  card: '#17221B',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#E2ECE5',
  textSecondary: '#9EB0A5',
  textMuted: '#687C70',
  border: 'rgba(255, 255, 255, 0.08)',
  inputBg: '#1F2E25',
  primary: '#66BB6A',
  primaryDark: '#0D6832',
  onPrimary: '#0A2E16',
  accentBg: 'rgba(102, 187, 106, 0.16)',
  headerBg: '#17221B',
  pillBg: '#1F2E25',
  cardAltBg: '#131C16',
  toolkitDoctorBg: 'rgba(102, 187, 106, 0.16)',
  toolkitDoctorIcon: '#66BB6A',
  toolkitSoilBg: 'rgba(245, 158, 11, 0.16)',
  toolkitSoilIcon: '#FBBF24',
  toolkitMapBg: 'rgba(56, 189, 248, 0.16)',
  toolkitMapIcon: '#38BDF8',
  toolkitExpertBg: 'rgba(192, 132, 252, 0.16)',
  toolkitExpertIcon: '#C084FC',
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
