import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const THEME_KEY = '@app_theme';

export const LIGHT_COLORS = {
  bg: '#F8F9FA',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  headerBg: '#FFFFFF',
  text: '#111827',
  subtext: '#6B7280',
  accent: '#6C63FF',
  accentLight: '#E0E7FF',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  inputBg: '#F3F4F6',
  inputBorder: '#D1D5DB',
  shadow: '#000000',
};

export const DARK_COLORS = {
  bg: '#111827',
  card: '#1F2937',
  cardBorder: '#374151',
  headerBg: '#1F2937',
  text: '#F9FAFB',
  subtext: '#9CA3AF',
  accent: '#818CF8',
  accentLight: '#3730A3',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  inputBg: '#374151',
  inputBorder: '#4B5563',
  shadow: '#000000',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val) setThemeMode(val);
    });
  }, []);

  const changeTheme = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  };

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
