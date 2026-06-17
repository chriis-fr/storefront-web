import type { CSSProperties } from 'react';

type ThemePreset = {
  background: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryContrast: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  radius: string;
};

export const themes: Record<string, ThemePreset> = {
  default: {
    background: '#ffffff',
    surface: '#f7f8fb',
    surfaceStrong: '#eef1f6',
    text: '#14171f',
    muted: '#687084',
    border: '#dfe3eb',
    primary: '#0f766e',
    primaryContrast: '#ffffff',
    accent: '#f59e0b',
    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
    radius: '8px'
  },
  marketplace: {
    background: '#fbfbf8',
    surface: '#f1f3ee',
    surfaceStrong: '#e4e8dd',
    text: '#17201b',
    muted: '#657166',
    border: '#d9dfd5',
    primary: '#315c48',
    primaryContrast: '#ffffff',
    accent: '#c26b35',
    success: '#247047',
    warning: '#a15c18',
    error: '#a83232',
    radius: '6px'
  },
  restaurant: {
    background: '#fffdf9',
    surface: '#f8f0e5',
    surfaceStrong: '#efe0ce',
    text: '#211813',
    muted: '#75665b',
    border: '#e7d5c2',
    primary: '#9f3a26',
    primaryContrast: '#ffffff',
    accent: '#2f6f73',
    success: '#227044',
    warning: '#a55f12',
    error: '#b3261e',
    radius: '8px'
  }
};

export function getThemeCssVariables(name: string): CSSProperties {
  const theme = themes[name] ?? themes.default;

  return {
    '--background': theme.background,
    '--surface': theme.surface,
    '--surface-strong': theme.surfaceStrong,
    '--text': theme.text,
    '--muted': theme.muted,
    '--border': theme.border,
    '--primary': theme.primary,
    '--primary-contrast': theme.primaryContrast,
    '--accent': theme.accent,
    '--success': theme.success,
    '--warning': theme.warning,
    '--error': theme.error,
    '--radius': theme.radius
  } as CSSProperties;
}
