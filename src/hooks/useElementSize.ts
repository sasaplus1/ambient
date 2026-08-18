import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

export type ElementSize = {
  width: number;
  height: number;
};

/**
 * Tracks an element's CSS pixel size with a ResizeObserver.
 * The element itself is observed rather than the window resize event, so the
 * size follows device rotation and the browser UI collapsing too.
 */
export function useElementSize<T extends Element>(): [
  RefObject<T>,
  ElementSize,
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;

      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return [ref, size];
}
