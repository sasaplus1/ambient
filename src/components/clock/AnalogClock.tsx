import { useEffect, useRef } from 'preact/hooks';

import { useElementSize } from '../../hooks/useElementSize';
import { readCssVar } from '../../lib/theme';
import { scaleStyle } from '../../state/typography';
import type { AnalogNumerals, SecondHand } from '../../types';

import { drawAnalogClock, type ClockColors } from './drawAnalogClock';

import './AnalogClock.css';

type AnalogClockProps = {
  secondHand: SecondHand;
  numerals: AnalogNumerals;
  /**
   * Not used for drawing. It is a dependency that signals a theme change, so
   * the CSS Custom Properties get read again.
   */
  theme: string;
};

/** How long a theme change takes, read from the same place the CSS uses. */
function fadeDuration(): number {
  const declared = readCssVar('--theme-fade');
  const ms = Number.parseFloat(declared);

  if (!Number.isFinite(ms)) {
    return 0;
  }

  return declared.endsWith('ms') ? ms : ms * 1000;
}

function readColors(): ClockColors {
  return {
    fg: readCssVar('--fg') || '#ffffff',
    fgSecondary: readCssVar('--fg-secondary') || '#888888',
    fgTertiary: readCssVar('--fg-tertiary') || '#555555',
    accent: readCssVar('--accent') || '#0a84ff',
  };
}

/**
 * An analog clock drawn straight onto a canvas.
 *
 * It never updates state per second. The draw loop reads new Date() and
 * repaints the canvas, so a running clock triggers no Preact re-render and
 * never drags the other widgets along with it.
 */
export function AnalogClock({ secondHand, numerals, theme }: AnalogClockProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Match the shorter side so the dial stays a true circle
  const size = Math.floor(Math.min(width, height));

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || size <= 0) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // devicePixelRatio changes on rotation and zoom, so read it on every setup
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    let colors = readColors();

    /*
     * Themes cross-fade, and the canvas cannot inherit that: it holds whatever
     * colour it was last told. So for as long as the fade runs, the colours are
     * read again on every paint, and the hands travel with the background
     * instead of snapping at the end of it.
     */
    const fadeEndsAt = performance.now() + fadeDuration();

    const paint = () => {
      if (performance.now() < fadeEndsAt) {
        colors = readColors();
      }

      drawAnalogClock(ctx, size, colors, numerals, secondHand, new Date());
    };

    let frameId = 0;
    let timerId: number | undefined;

    if (secondHand === 'sweep') {
      // Draw every frame only when the motion has to look smooth
      const loop = () => {
        paint();
        frameId = requestAnimationFrame(loop);
      };

      loop();
    } else {
      // Without a sweeping hand, one paint per boundary is enough
      const interval = secondHand === 'step' ? 1_000 : 60_000;

      const tick = () => {
        paint();
        timerId = window.setTimeout(
          tick,
          Math.max(interval - (Date.now() % interval), 16),
        );
      };

      tick();

      // A once-a-second repaint would show the fade as a handful of steps
      const followFade = () => {
        if (performance.now() >= fadeEndsAt) {
          return;
        }

        paint();
        frameId = requestAnimationFrame(followFade);
      };

      followFade();
    }

    const repaintOnVisible = () => {
      if (document.visibilityState === 'visible') {
        paint();
      }
    };

    document.addEventListener('visibilitychange', repaintOnVisible);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', repaintOnVisible);
    };
  }, [size, numerals, secondHand, theme]);

  return (
    <div class="analog-clock" ref={containerRef} style={scaleStyle('clock')}>
      <canvas class="analog-clock__canvas" ref={canvasRef} />
    </div>
  );
}
