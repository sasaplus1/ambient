/**
 * Background gradients, written out rather than shipped as images.
 *
 * A photo would mean carrying someone else's licence around in a repository
 * that is otherwise MIT, and megabytes in a bundle meant to start offline on an
 * old device. These cost a few hundred bytes and raise no such question.
 *
 * Most are dark: the dashboard is looked at in a dim room for hours, and pale
 * light text needs something to sit against. The few light ones are there for
 * the Light theme.
 */

export type Gradient = {
  id: string;
  /** Shown as-is in both locales, as the theme names are. */
  label: string;
  css: string;
};

export const GRADIENTS: readonly Gradient[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    css: 'radial-gradient(120% 120% at 20% 0%, #1b2a4a 0%, #0a0f1e 55%, #05070d 100%)',
  },
  {
    id: 'nocturne',
    label: 'Nocturne',
    css: 'radial-gradient(130% 110% at 80% 10%, #2d1b4e 0%, #150d26 55%, #08060f 100%)',
  },
  {
    id: 'abyss',
    label: 'Abyss',
    css: 'radial-gradient(150% 120% at 50% 120%, #12283d 0%, #071320 50%, #01050a 100%)',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    css: 'linear-gradient(160deg, #0b3d4f 0%, #0a2438 55%, #050d18 100%)',
  },
  {
    id: 'forest',
    label: 'Forest',
    css: 'linear-gradient(170deg, #123528 0%, #0b2019 55%, #050d0a 100%)',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    css: 'linear-gradient(200deg, #0f3b3a 0%, #16324f 40%, #2a1f4d 70%, #0a0a14 100%)',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    css: 'linear-gradient(190deg, #472a4d 0%, #33243f 40%, #17131f 100%)',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    css: 'linear-gradient(195deg, #6b2f3a 0%, #45253c 45%, #1a1220 100%)',
  },
  {
    id: 'ember',
    label: 'Ember',
    css: 'radial-gradient(120% 130% at 30% 110%, #6b3218 0%, #331a10 50%, #0e0806 100%)',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    css: 'linear-gradient(175deg, #3c2f22 0%, #241c14 55%, #0d0a07 100%)',
  },
  {
    id: 'neon',
    label: 'Neon',
    css: 'radial-gradient(120% 120% at 15% 15%, #2a0f47 0%, #101a3d 55%, #05060f 100%)',
  },
  {
    id: 'slate',
    label: 'Slate',
    css: 'linear-gradient(165deg, #2b3440 0%, #1a2029 55%, #0b0e12 100%)',
  },
  {
    id: 'mono',
    label: 'Mono',
    css: 'linear-gradient(180deg, #2a2a2a 0%, #161616 55%, #050505 100%)',
  },
  {
    id: 'dawn',
    label: 'Dawn',
    css: 'linear-gradient(185deg, #f4c9a8 0%, #e6a9a2 45%, #b58ba8 100%)',
  },
  {
    id: 'sakura',
    label: 'Sakura',
    css: 'linear-gradient(185deg, #fbe4ec 0%, #f2c9d8 50%, #d9b4c8 100%)',
  },
  {
    id: 'mist',
    label: 'Mist',
    css: 'linear-gradient(185deg, #e8eef3 0%, #cfd9e2 55%, #b3c0cd 100%)',
  },
] as const;

export function isGradientId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    GRADIENTS.some((gradient) => gradient.id === value)
  );
}

export function gradientCss(id: string): string | null {
  return GRADIENTS.find((gradient) => gradient.id === id)?.css ?? null;
}

export const DEFAULT_GRADIENT = 'midnight';
