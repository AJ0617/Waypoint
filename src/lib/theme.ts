import type { Alliance } from '../types';

/** Alliance-red/blue + dark-mode overrides layered on top of the base Modernist tokens. */
export function buildThemeVars(dark: boolean, alliance: Alliance): Record<string, string> {
  const vars: Record<string, string> = {};

  if (alliance === 'red') {
    vars['--color-accent'] = dark ? '#f0797b' : '#e5383b';
    vars['--color-accent-100'] = dark ? 'color-mix(in srgb, #e5383b 20%, var(--color-neutral-800))' : '#fce8e8';
    vars['--color-accent-200'] = '#f6c6c6';
    vars['--color-accent-300'] = '#f0a3a3';
    vars['--color-accent-600'] = '#c62f31';
    vars['--color-accent-700'] = dark ? '#f0a3a3' : '#9c2426';
    vars['--color-accent-800'] = dark ? '#f6c6c6' : '#7a1c1e';
  }
  if (alliance === 'blue') {
    vars['--color-accent'] = dark ? '#5b9ee6' : '#1f6fd1';
    vars['--color-accent-100'] = dark ? 'color-mix(in srgb, #1f6fd1 20%, var(--color-neutral-800))' : '#eaf2fc';
    vars['--color-accent-200'] = '#cfe3fa';
    vars['--color-accent-300'] = '#a6cbf5';
    vars['--color-accent-600'] = '#175bb0';
    vars['--color-accent-700'] = dark ? '#a6cbf5' : '#134a8f';
    vars['--color-accent-800'] = dark ? '#cfe3fa' : '#0f3a70';
  }
  if (dark) {
    vars['--color-bg'] = 'var(--color-neutral-900)';
    vars['--color-surface'] = 'var(--color-neutral-800)';
    vars['--color-text'] = 'var(--color-neutral-100)';
    vars['--color-divider'] = 'color-mix(in srgb, var(--color-neutral-100) 25%, transparent)';
    vars['--color-neutral-500'] = 'var(--color-neutral-400)';
    vars['--color-neutral-600'] = 'var(--color-neutral-400)';
    vars['--color-warning-bg'] = 'color-mix(in srgb, #e0a458 20%, var(--color-neutral-800))';
    vars['--color-warning-text'] = '#f0cb96';
  }
  return vars;
}
