import type { CardThemeId } from '../types';

export interface CardTheme {
  id: CardThemeId;
  label: string;
  bg: string;
  fg: string;
  accent: string;
  dark?: boolean;
}

export const CARD_THEMES: CardTheme[] = [
  { id: 'paper', label: 'Paper', bg: '#f5f1e8', fg: '#14120f', accent: '#14120f' },
  { id: 'sand', label: 'Sand', bg: '#e8dcc4', fg: '#2a2418', accent: '#8b6f3f' },
  { id: 'sage', label: 'Sage', bg: '#dde5d8', fg: '#1a2418', accent: '#4a6b3f' },
  { id: 'sky', label: 'Sky', bg: '#d8e3ec', fg: '#152230', accent: '#3f5a7a' },
  { id: 'rose', label: 'Rose', bg: '#ecd8d8', fg: '#2a1818', accent: '#8b3f3f' },
  { id: 'lilac', label: 'Lilac', bg: '#e0dceb', fg: '#1f1830', accent: '#5a4a8b' },
  { id: 'ink', label: 'Ink', bg: '#1a1815', fg: '#f5f1e8', accent: '#d97757', dark: true },
  { id: 'cocoa', label: 'Cocoa', bg: '#2a2218', fg: '#f0e6d4', accent: '#d4a574', dark: true },
];

export const themeById = (id: string): CardTheme =>
  CARD_THEMES.find(t => t.id === id) || CARD_THEMES[0];

export const COUNTDOWN_STYLES = [
  { value: 'large' as const, label: 'Large number' },
  { value: 'digital' as const, label: 'Digital clock' },
  { value: 'ring' as const, label: 'Progress ring' },
  { value: 'dots' as const, label: 'Dot grid' },
  { value: 'flip' as const, label: 'Flip clock' },
];
