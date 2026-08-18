export const THEMES = ['light', 'dark', 'oled', 'warm'] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'dark';

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  oled: 'OLED Black',
  warm: 'Warm',
};

export function themeLabel(theme: Theme): string {
  return THEME_LABELS[theme];
}

export function isTheme(value: unknown): value is Theme {
  return (
    typeof value === 'string' && (THEMES as readonly string[]).includes(value)
  );
}

/**
 * Reads a CSS Custom Property.
 * A canvas cannot resolve CSS variables itself, so the drawing code uses this
 * to pick up its colours.
 */
export function readCssVar(
  name: string,
  element: Element = document.documentElement,
): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

/**
 * Matches the PWA's system UI colour to the background of the active theme.
 */
function syncThemeColor(): void {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );

  if (!meta) {
    return;
  }

  const background = readCssVar('--bg');

  if (background) {
    meta.content = background;
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
  syncThemeColor();
}
