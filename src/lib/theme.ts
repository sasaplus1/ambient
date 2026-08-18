/**
 * A theme is the background and the colours read against it, decided together.
 *
 * They were separate once - a palette plus an independent gradient - and half
 * the combinations were unreadable. Pale text on the Sakura gradient measures
 * 1.02:1, where WCAG asks 3.0 for large text. Pairing them here means no such
 * combination exists to be chosen.
 */

export type ThemeTone = 'dark' | 'light';

export type Theme = {
  id: string;
  /** Shown as-is in both locales, as a proper name. */
  label: string;
  /** Decides the browser UI colour scheme and the form control palette. */
  tone: ThemeTone;
  colors: {
    /** Flat colour behind everything; also what the image dimmer fades to. */
    bg: string;
    /** Optional gradient laid over bg. */
    gradient?: string;
    fg: string;
    fgSecondary: string;
    fgTertiary: string;
    accent: string;
    surface: string;
    surfaceBorder: string;
    scrim: string;
  };
};

const DARK_SURFACE = {
  surfaceBorder: 'rgb(255 255 255 / 0.12)',
  scrim: 'rgb(0 0 0 / 0.6)',
};

const LIGHT_SURFACE = {
  surfaceBorder: 'rgb(0 0 0 / 0.1)',
  scrim: 'rgb(0 0 0 / 0.35)',
};

export const THEMES: readonly Theme[] = [
  // Flat themes first: no gradient, just a colour.
  {
    id: 'dark',
    label: 'Dark',
    tone: 'dark',
    colors: {
      bg: '#121214',
      fg: '#ececf0',
      fgSecondary: '#8e8e93',
      fgTertiary: '#5a5a5f',
      accent: '#0a84ff',
      surface: '#1e1e21',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'light',
    label: 'Light',
    tone: 'light',
    colors: {
      bg: '#f5f5f7',
      fg: '#1c1c1e',
      fgSecondary: '#6b6b70',
      fgTertiary: '#a8a8ad',
      accent: '#0a84ff',
      surface: '#ffffff',
      ...LIGHT_SURFACE,
    },
  },
  {
    id: 'oled',
    label: 'OLED Black',
    tone: 'dark',
    colors: {
      bg: '#000000',
      fg: '#d8d8dc',
      fgSecondary: '#77777c',
      fgTertiary: '#3f3f44',
      accent: '#4a9eff',
      surface: '#0a0a0a',
      surfaceBorder: 'rgb(255 255 255 / 0.14)',
      scrim: 'rgb(0 0 0 / 0.75)',
    },
  },
  {
    id: 'warm',
    label: 'Warm',
    tone: 'dark',
    colors: {
      bg: '#1a1410',
      fg: '#f0e0cc',
      fgSecondary: '#a08e78',
      fgTertiary: '#6b5c4a',
      accent: '#ff9f43',
      surface: '#241c16',
      surfaceBorder: 'rgb(240 224 204 / 0.14)',
      scrim: 'rgb(0 0 0 / 0.6)',
    },
  },

  // Gradient themes. Each carries the foreground it was balanced against.
  {
    id: 'midnight',
    label: 'Midnight',
    tone: 'dark',
    colors: {
      bg: '#05070d',
      gradient:
        'radial-gradient(120% 120% at 20% 0%, #1b2a4a 0%, #0a0f1e 55%, #05070d 100%)',
      fg: '#e9edf6',
      fgSecondary: '#8f9bb3',
      fgTertiary: '#525c70',
      accent: '#5aa9ff',
      surface: '#111725',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'nocturne',
    label: 'Nocturne',
    tone: 'dark',
    colors: {
      bg: '#08060f',
      gradient:
        'radial-gradient(130% 110% at 80% 10%, #2d1b4e 0%, #150d26 55%, #08060f 100%)',
      fg: '#ece6f6',
      fgSecondary: '#9b8fb3',
      fgTertiary: '#5c5170',
      accent: '#b78dff',
      surface: '#181128',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'abyss',
    label: 'Abyss',
    tone: 'dark',
    colors: {
      bg: '#01050a',
      gradient:
        'radial-gradient(150% 120% at 50% 120%, #12283d 0%, #071320 50%, #01050a 100%)',
      fg: '#e4eef5',
      fgSecondary: '#87a0b3',
      fgTertiary: '#4c606f',
      accent: '#49c5e8',
      surface: '#0b1926',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    tone: 'dark',
    colors: {
      bg: '#050d18',
      gradient:
        'linear-gradient(160deg, #0b3d4f 0%, #0a2438 55%, #050d18 100%)',
      fg: '#e2f0f4',
      fgSecondary: '#85a7b3',
      fgTertiary: '#4b656f',
      accent: '#3fbcd4',
      surface: '#0c2130',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    tone: 'dark',
    colors: {
      bg: '#050d0a',
      gradient:
        'linear-gradient(170deg, #123528 0%, #0b2019 55%, #050d0a 100%)',
      fg: '#e3f2e9',
      fgSecondary: '#86a897',
      fgTertiary: '#4d6659',
      accent: '#57c98d',
      surface: '#0d2119',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    tone: 'dark',
    colors: {
      bg: '#0a0a14',
      gradient:
        'linear-gradient(200deg, #0f3b3a 0%, #16324f 40%, #2a1f4d 70%, #0a0a14 100%)',
      fg: '#e6f2f0',
      fgSecondary: '#8ba6ab',
      fgTertiary: '#516468',
      accent: '#5fe0c0',
      surface: '#132030',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'dusk',
    label: 'Dusk',
    tone: 'dark',
    colors: {
      bg: '#17131f',
      gradient:
        'linear-gradient(190deg, #472a4d 0%, #33243f 40%, #17131f 100%)',
      fg: '#f0e7f2',
      fgSecondary: '#a794ad',
      fgTertiary: '#655a6b',
      accent: '#d08bd8',
      surface: '#241c2c',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    tone: 'dark',
    colors: {
      bg: '#1a1220',
      gradient:
        'linear-gradient(195deg, #6b2f3a 0%, #45253c 45%, #1a1220 100%)',
      fg: '#f7e6e6',
      fgSecondary: '#b8929a',
      fgTertiary: '#6f585e',
      accent: '#ff8a7a',
      surface: '#291b28',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    tone: 'dark',
    colors: {
      bg: '#0e0806',
      gradient:
        'radial-gradient(120% 130% at 30% 110%, #6b3218 0%, #331a10 50%, #0e0806 100%)',
      fg: '#f7e7da',
      fgSecondary: '#b6957f',
      fgTertiary: '#6d594c',
      accent: '#ff9550',
      surface: '#22140e',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'sepia',
    label: 'Sepia',
    tone: 'dark',
    colors: {
      bg: '#0d0a07',
      gradient:
        'linear-gradient(175deg, #3c2f22 0%, #241c14 55%, #0d0a07 100%)',
      fg: '#f0e6d8',
      fgSecondary: '#ab9c86',
      fgTertiary: '#665d50',
      accent: '#d4a45f',
      surface: '#1d1710',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    tone: 'dark',
    colors: {
      bg: '#05060f',
      gradient:
        'radial-gradient(120% 120% at 15% 15%, #2a0f47 0%, #101a3d 55%, #05060f 100%)',
      fg: '#eae6ff',
      fgSecondary: '#9a92c4',
      fgTertiary: '#5a5578',
      accent: '#ff5cc8',
      surface: '#140f2a',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    tone: 'dark',
    colors: {
      bg: '#0b0e12',
      gradient:
        'linear-gradient(165deg, #2b3440 0%, #1a2029 55%, #0b0e12 100%)',
      fg: '#e8ecf1',
      fgSecondary: '#94a0ae',
      fgTertiary: '#57616c',
      accent: '#7aa7d9',
      surface: '#161c24',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'mono',
    label: 'Mono',
    tone: 'dark',
    colors: {
      bg: '#050505',
      gradient:
        'linear-gradient(180deg, #2a2a2a 0%, #161616 55%, #050505 100%)',
      fg: '#ededed',
      fgSecondary: '#999999',
      fgTertiary: '#5c5c5c',
      accent: '#d0d0d0',
      surface: '#151515',
      ...DARK_SURFACE,
    },
  },
  {
    id: 'dawn',
    label: 'Dawn',
    tone: 'light',
    colors: {
      bg: '#f4c9a8',
      gradient:
        'linear-gradient(185deg, #f4c9a8 0%, #e6a9a2 45%, #b58ba8 100%)',
      fg: '#2a1a26',
      fgSecondary: '#5f4453',
      fgTertiary: '#8c7180',
      accent: '#a03d6b',
      surface: '#fbeee6',
      ...LIGHT_SURFACE,
    },
  },
  {
    id: 'sakura',
    label: 'Sakura',
    tone: 'light',
    colors: {
      bg: '#fbe4ec',
      gradient:
        'linear-gradient(185deg, #fbe4ec 0%, #f2c9d8 50%, #d9b4c8 100%)',
      fg: '#3a2230',
      fgSecondary: '#6f4f5f',
      fgTertiary: '#9c7c8c',
      accent: '#c2185b',
      surface: '#fff3f7',
      ...LIGHT_SURFACE,
    },
  },
  {
    id: 'mist',
    label: 'Mist',
    tone: 'light',
    colors: {
      bg: '#e8eef3',
      gradient:
        'linear-gradient(185deg, #e8eef3 0%, #cfd9e2 55%, #b3c0cd 100%)',
      fg: '#1e2833',
      fgSecondary: '#4f5c6b',
      fgTertiary: '#7d8a99',
      accent: '#1f6fb2',
      surface: '#f6f9fb',
      ...LIGHT_SURFACE,
    },
  },
] as const;

export const DEFAULT_THEME = 'midnight';

export function findTheme(id: string): Theme | undefined {
  return THEMES.find((theme) => theme.id === id);
}

export function isThemeId(value: unknown): value is string {
  return typeof value === 'string' && findTheme(value) !== undefined;
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
 * Writes a theme's colours onto an element as custom properties.
 *
 * Taking a target lets the settings preview render one theme while the page
 * behind it is still showing another.
 */
export function applyThemeTo(theme: Theme, element: HTMLElement): void {
  const { colors } = theme;

  element.style.setProperty('--bg', colors.bg);
  element.style.setProperty('--fg', colors.fg);
  element.style.setProperty('--fg-secondary', colors.fgSecondary);
  element.style.setProperty('--fg-tertiary', colors.fgTertiary);
  element.style.setProperty('--accent', colors.accent);
  element.style.setProperty('--surface', colors.surface);
  element.style.setProperty('--surface-border', colors.surfaceBorder);
  element.style.setProperty('--scrim', colors.scrim);
  element.style.setProperty('color-scheme', theme.tone);
}

/**
 * Matches the PWA's system UI colour to the background of the active theme.
 */
function syncThemeColor(theme: Theme): void {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );

  if (meta) {
    meta.content = theme.colors.bg;
  }
}

export function applyTheme(id: string): void {
  const theme = findTheme(id) ?? findTheme(DEFAULT_THEME);

  if (!theme) {
    return;
  }

  applyThemeTo(theme, document.documentElement);
  document.documentElement.dataset['tone'] = theme.tone;
  syncThemeColor(theme);
}
