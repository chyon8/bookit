import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  secondary: string;
  error: string;
  surface: string;
}

const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#03314B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  primary: '#4ADE80',
  secondary: '#F1F5F9',
  error: '#EF4444',
  surface: '#FFFFFF',
};

const darkColors: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
  primary: '#4ADE80',
  secondary: '#1E293B',
  error: '#F87171',
  surface: '#1E293B',
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@bookit_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Load persisted theme
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeState(savedTheme as Theme);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      }
    };
    loadTheme();
  }, []);

  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
