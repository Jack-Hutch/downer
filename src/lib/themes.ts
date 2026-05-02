import { useMemo } from 'react';
import { useStore } from '../store/store';
import type { CardTheme } from '../types';

// Re-export so existing imports keep working.
export type { CardTheme };

/**
 * Built-in card themes — eight muted, premium pastels designed by hand.
 * These ship with the app and CAN'T be deleted or edited (the editor in
 * ThemesView refuses to mutate any theme with `builtin: true`). Users can
 * still duplicate one and tweak the copy.
 */
export const CARD_THEMES: CardTheme[] = [
  { id: 'paper', label: 'Paper', bg: '#f5f1e8', fg: '#14120f', accent: '#14120f', builtin: true },
  { id: 'sand',  label: 'Sand',  bg: '#e8dcc4', fg: '#2a2418', accent: '#8b6f3f', builtin: true },
  { id: 'sage',  label: 'Sage',  bg: '#dde5d8', fg: '#1a2418', accent: '#4a6b3f', builtin: true },
  { id: 'sky',   label: 'Sky',   bg: '#d8e3ec', fg: '#152230', accent: '#3f5a7a', builtin: true },
  { id: 'rose',  label: 'Rose',  bg: '#ecd8d8', fg: '#2a1818', accent: '#8b3f3f', builtin: true },
  { id: 'lilac', label: 'Lilac', bg: '#e0dceb', fg: '#1f1830', accent: '#5a4a8b', builtin: true },
  { id: 'ink',   label: 'Ink',   bg: '#1a1815', fg: '#f5f1e8', accent: '#d97757', dark: true, builtin: true },
  { id: 'cocoa', label: 'Cocoa', bg: '#2a2218', fg: '#f0e6d4', accent: '#d4a574', dark: true, builtin: true },
];

/**
 * Resolve a theme ID against built-ins + an optional list of custom themes.
 * Falls back to the first built-in if the ID can't be matched (e.g. an event
 * referenced a custom theme the user later deleted).
 */
export const themeById = (id: string, customThemes: CardTheme[] = []): CardTheme =>
  customThemes.find(t => t.id === id) ||
  CARD_THEMES.find(t => t.id === id) ||
  CARD_THEMES[0];

/**
 * React hook — returns built-ins + the user's custom themes, merged. Use this
 * inside any component that needs to render or pick a theme so updates flow
 * reactively when the user adds / edits / deletes a custom theme.
 */
export function useResolvedThemes(): CardTheme[] {
  const customThemes = useStore(s => s.customThemes);
  return useMemo(() => [...CARD_THEMES, ...customThemes], [customThemes]);
}

/** Hook variant that returns a single theme by ID, reactive to changes. */
export function useTheme(id: string): CardTheme {
  const themes = useResolvedThemes();
  return useMemo(() => themes.find(t => t.id === id) ?? themes[0], [themes, id]);
}

export const COUNTDOWN_STYLES = [
  { value: 'large' as const,   label: 'Large number' },
  { value: 'digital' as const, label: 'Digital clock' },
  { value: 'ring' as const,    label: 'Progress ring' },
  { value: 'dots' as const,    label: 'Dot grid' },
  { value: 'flip' as const,    label: 'Flip clock' },
];
