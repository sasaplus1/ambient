import { useEffect, useRef } from 'preact/hooks';

import { useElementSize } from '../../hooks/useElementSize';
import {
  isPaintDue,
  msUntilNextTick,
  SWEEP_TARGET_HZ,
  type TickUnit,
} from '../../lib/clockSchedule';
import { readCssVar } from '../../lib/theme';
import {
  countDraw,
  countFrame,
  forgetCanvas,
  noteCanvas,
} from '../../state/clockMetrics';
import { fontClass, fontFamilyOf, scaleStyle } from '../../state/typography';
import type { AnalogNumerals, SecondHand } from '../../types';

import { type ClockColors, drawDial, drawHands } from './drawAnalogClock';

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

/**
 * The most device pixels a dial is drawn at.
 *
 * Everything that rasterises - the clear of the whole face included - grows
 * with the square of this, so a phone offering 2.75 asks for nearly twice the
 * pixels of one offering 2. What that buys on a face made of hairline strokes
 * is very little, and this dashboard is left running for days at a time.
 */
const MAX_RATIO = 2;

/** How long a theme change takes, read from the same place the CSS uses. */
function fadeDuration(from: Element): number {
  const declared = readCssVar('--theme-fade', from);
  const ms = Number.parseFloat(declared);

  if (!Number.isFinite(ms)) {
    return 0;
  }

  return declared.endsWith('ms') ? ms : ms * 1000;
}

/**
 * Read from the canvas rather than the root.
 *
 * Custom properties inherit, so this picks up the values in effect where the
 * clock actually sits - which is how the settings preview can stand in a
 * different theme from the page behind it.
 */
function readColors(from: Element): ClockColors {
  return {
    fg: readCssVar('--fg', from) || '#ffffff',
    fgSecondary: readCssVar('--fg-secondary', from) || '#888888',
    fgTertiary: readCssVar('--fg-tertiary', from) || '#555555',
    accent: readCssVar('--accent', from) || '#0a84ff',
  };
}

/**
 * An analog clock drawn straight onto a canvas.
 *
 * It never updates state per second. The draw loop reads new Date() and
 * repaints the canvas, so a running clock triggers no Preact re-render and
 * never drags the other widgets along with it.
 *
 * The face and the hands go on separate canvases. Nearly all of the drawing
 * here is the face, and none of it moves, so a sweeping hand repaints three
 * strokes and a cap rather than seventy-six of them.
 */
export function AnalogClock({ secondHand, numerals, theme }: AnalogClockProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>();
  // Only a dependency: the face itself is read off the canvas below
  const fontSetting = fontFamilyOf('clock');
  const dialRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<HTMLCanvasElement>(null);

  // Match the shorter side so the dial stays a true circle
  const size = Math.floor(Math.min(width, height));

  useEffect(() => {
    const dial = dialRef.current;
    const hands = handsRef.current;

    if (!dial || !hands || size <= 0) {
      return;
    }

    const dialCtx = dial.getContext('2d');
    const handsCtx = hands.getContext('2d');

    if (!dialCtx || !handsCtx) {
      return;
    }

    // devicePixelRatio changes on rotation and zoom, so read it on every setup
    const offered = window.devicePixelRatio || 1;
    const ratio = Math.min(offered, MAX_RATIO);

    for (const canvas of [dial, hands]) {
      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }

    dialCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    handsCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    noteCanvas(ratio, offered);

    let colors = readColors(hands);
    // A canvas has no stylesheet of its own, so the face has to be looked up
    const fontFamily = getComputedStyle(hands).fontFamily;

    /*
     * Themes cross-fade, and the canvas cannot inherit that: it holds whatever
     * colour it was last told. So for as long as the fade runs, the colours are
     * read again on every paint and the face is drawn again with them, and the
     * clock travels with the background instead of snapping at the end of it.
     */
    const fadeEndsAt = performance.now() + fadeDuration(hands);

    drawDial(dialCtx, size, colors, numerals, fontFamily);

    const paint = (now: Date) => {
      if (performance.now() < fadeEndsAt) {
        colors = readColors(hands);
        drawDial(dialCtx, size, colors, numerals, fontFamily);
      }

      countDraw();
      drawHands(handsCtx, size, colors, secondHand, now);
    };

    let frameId = 0;
    let timerId: number | undefined;
    let lastPaintAt = performance.now();
    let previousFrameAt = 0;

    /**
     * Books a frame in, and says whether it is this one's turn to be drawn.
     * Shared by the sweep loop and the fade follower, which want the same rate.
     */
    const takeFrame = (timestamp: number): boolean => {
      countFrame();

      const frameMs = timestamp - previousFrameAt;

      previousFrameAt = timestamp;

      if (!isPaintDue(timestamp - lastPaintAt, frameMs, SWEEP_TARGET_HZ)) {
        return false;
      }

      lastPaintAt = timestamp;

      return true;
    };

    if (secondHand === 'sweep') {
      const loop = (timestamp: number) => {
        frameId = requestAnimationFrame(loop);

        if (takeFrame(timestamp)) {
          paint(new Date());
        }
      };

      // Drawn now rather than on the first frame, which would flash an empty face
      paint(new Date());
      frameId = requestAnimationFrame(loop);
    } else {
      // Without a sweeping hand, one paint per boundary is enough
      const unit: TickUnit = secondHand === 'step' ? 'second' : 'minute';

      const tick = () => {
        const now = new Date();

        paint(now);
        /*
         * Measured from the time drawn for, not from now. Reading the clock
         * again after the drawing would aim at the boundary after the one just
         * crossed, and the tick in between would never be shown.
         */
        timerId = window.setTimeout(tick, msUntilNextTick(now, unit));
      };

      tick();

      // A once-a-second repaint would show the fade as a handful of steps
      const followFade = (timestamp: number) => {
        if (performance.now() >= fadeEndsAt) {
          return;
        }

        frameId = requestAnimationFrame(followFade);

        if (takeFrame(timestamp)) {
          paint(new Date());
        }
      };

      frameId = requestAnimationFrame(followFade);
    }

    const repaintOnVisible = () => {
      if (document.visibilityState === 'visible') {
        paint(new Date());
      }
    };

    document.addEventListener('visibilitychange', repaintOnVisible);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', repaintOnVisible);
      forgetCanvas();
    };
    /*
     * theme is in here so the colours are read again, which means a theme
     * change also reallocates both backing stores. Left as it is: the face has
     * to be redrawn either way, and a theme changes a handful of times a day.
     */
  }, [size, numerals, secondHand, theme, fontSetting]);

  return (
    <div
      class={`analog-clock ${fontClass('clock')}`}
      ref={containerRef}
      style={scaleStyle('clock')}
    >
      <canvas class="analog-clock__layer" ref={dialRef} />
      <canvas class="analog-clock__layer" ref={handsRef} />
    </div>
  );
}
