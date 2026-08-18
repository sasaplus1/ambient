import { useEffect, useRef, useState } from 'preact/hooks';

import { DEFAULT_THEME, findTheme } from '../lib/theme';
import { activeTheme } from '../state/theme';

import './ThemeBackdrop.css';

type Layer = {
  color: string;
  gradient: string;
};

function layerFor(id: string): Layer {
  const theme = findTheme(id) ?? findTheme(DEFAULT_THEME);

  return {
    color: theme?.colors.bg ?? '#121214',
    gradient: theme?.colors.gradient ?? 'none',
  };
}

/**
 * The theme's background, cross-faded when the theme changes.
 *
 * Two stacked layers rather than a transition on the background itself: CSS
 * cannot interpolate one gradient into another, and these gradients are not
 * even the same shape - some radial, some linear, at different angles. Fading
 * a new layer in over the old works for any pair, so every theme can take part
 * and the scheduled changes need no palette of their own.
 *
 * Rendered inside .dashboard, which the settings preview also renders. The
 * preview's stage is scaled, and a transform makes it the containing block for
 * fixed positioning, so the miniature gets its own backdrop for free.
 */
export function ThemeBackdrop() {
  const id = activeTheme.value;

  const [layers, setLayers] = useState<[Layer, Layer]>(() => [
    layerFor(id),
    layerFor(id),
  ]);
  const [front, setFront] = useState(0);
  const shown = useRef(id);

  useEffect(() => {
    if (shown.current === id) {
      return;
    }

    shown.current = id;

    // Paint the hidden layer, then bring it forward: it starts at zero opacity,
    // so raising it in the same update is what the transition runs on.
    const back = front === 0 ? 1 : 0;

    setLayers((current) => {
      const next: [Layer, Layer] = [...current];

      next[back] = layerFor(id);

      return next;
    });
    setFront(back);
  }, [id, front]);

  return (
    <div class="theme-backdrop" aria-hidden="true">
      {layers.map((layer, index) => (
        <div
          key={index}
          class="theme-backdrop__layer"
          data-front={index === front}
          style={{
            backgroundColor: layer.color,
            backgroundImage: layer.gradient,
          }}
        />
      ))}
    </div>
  );
}
