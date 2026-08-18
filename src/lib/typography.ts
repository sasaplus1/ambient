export const FONT_FAMILIES = ['sans', 'serif', 'mono', 'condensed'] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];

export const TEXT_SCALES = ['s', 'm', 'l', 'xl'] as const;
export type TextScale = (typeof TEXT_SCALES)[number];

export function isFontFamily(value: unknown): value is FontFamily {
  return (
    typeof value === 'string' &&
    (FONT_FAMILIES as readonly string[]).includes(value)
  );
}

export function isTextScale(value: unknown): value is TextScale {
  return (
    typeof value === 'string' && (TEXT_SCALES as readonly string[]).includes(value)
  );
}

/**
 * Multiplier applied to every widget's type size.
 *
 * A dashboard read from across a room needs different sizes than one on a desk,
 * and the right answer depends on the device as much as the taste.
 */
const SCALE_FACTORS: Record<TextScale, number> = {
  s: 0.85,
  m: 1,
  l: 1.2,
  xl: 1.45,
};

export function scaleFactor(scale: TextScale): number {
  return SCALE_FACTORS[scale];
}

/** Widgets that can be given their own face. */
export const FONT_TARGETS = ['clock', 'date', 'weather', 'calendar'] as const;
export type FontTarget = (typeof FONT_TARGETS)[number];
