import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';

import type { WeatherIconName } from '../../lib/weather';

type WeatherIconProps = {
  name: WeatherIconName;
};

const CLOUD = 'M7 17h9.6a3.6 3.6 0 0 0 .4-7.2 5.6 5.6 0 0 0-10.7-1.2A4.2 4.2 0 0 0 7 17z';

/** Smaller, and drawn over whatever sits behind it. */
const CLOUD_FRONT =
  'M9 19h8.2a3.4 3.4 0 0 0 .4-6.8 5 5 0 0 0-9.6-1A3.9 3.9 0 0 0 9 19z';

/**
 * The sun or the moon, with the shape of the front cloud taken out of it.
 *
 * Something has to occlude what sits behind the cloud, or the two outlines
 * overlap into a tangle. This used to be done by filling the cloud with the
 * page background colour, which worked as long as the page was that colour -
 * but the dashboard can have a photograph behind it, and a shape painted in
 * the theme colour over a photograph reads as a blob of paint. Taking the
 * pixels away instead paints nothing, and it leaves every cloud in the set
 * drawn the same way: outline, no fill.
 *
 * The hole is the cloud's own outline stroked at twice the width the icon is
 * drawn at, so what is behind reappears clear of the cloud rather than flush
 * against it.
 *
 * The mask needs an id to be referred to, and there are six of these icons on
 * screen at once - the current conditions and five days of forecast - so the
 * id comes from useId rather than being written down here.
 */
function BehindCloud({ children }: { children: ComponentChildren }) {
  const id = useId();

  return (
    <>
      <mask
        id={id}
        maskUnits="userSpaceOnUse"
        x="-2"
        y="-2"
        width="28"
        height="30"
      >
        <rect x="-2" y="-2" width="28" height="30" fill="white" />
        <path d={CLOUD_FRONT} fill="black" stroke="black" stroke-width="3.2" />
      </mask>
      <g mask={`url(#${id})`}>{children}</g>
    </>
  );
}

function Body({ name }: WeatherIconProps) {
  switch (name) {
    case 'clear-day':
      return (
        <g>
          <circle cx="12" cy="11" r="4.2" />
          <path d="M12 2.6v1.8M12 17.6v1.8M2.6 11h1.8M19.6 11h1.8M5.3 4.3l1.3 1.3M17.4 16.4l1.3 1.3M18.7 4.3l-1.3 1.3M6.6 16.4l-1.3 1.3" />
        </g>
      );

    case 'clear-night':
      return <path d="M20 15A8.6 8.6 0 0 1 9 4a7.6 7.6 0 1 0 11 11z" />;

    case 'partly-day':
      return (
        <g>
          <BehindCloud>
            <circle cx="8.5" cy="8" r="3" />
            {/*
              Four rays, not five. There was one more at the sun's lower left,
              which is exactly where the cloud is: almost all of it fell inside
              the mask and what came out the far side was a hairline sitting
              off on its own, reading as a stray mark rather than as a ray.

              Removing it is also the more honest drawing. The sun is partly
              behind a cloud, so the part of it pointing into the cloud is not
              something that would be seen.
            */}
            <path d="M8.5 2.4v1.5M2.9 8h1.5M4.5 4l1.1 1.1M12.5 4l-1.1 1.1" />
          </BehindCloud>
          <path d={CLOUD_FRONT} />
        </g>
      );

    case 'partly-night':
      return (
        <g>
          <BehindCloud>
            <path d="M15 10.5A6 6 0 0 1 8.2 3.6a5.2 5.2 0 1 0 6.8 6.9z" />
          </BehindCloud>
          <path d={CLOUD_FRONT} />
        </g>
      );

    case 'cloudy':
      return <path d={CLOUD} />;

    case 'fog':
      return (
        <g>
          <path d="M7 14h9.6a3.6 3.6 0 0 0 .4-7.2A5.6 5.6 0 0 0 6.3 5.6 4.2 4.2 0 0 0 7 14z" />
          <path d="M4 18h16M6.5 22h11" />
        </g>
      );

    case 'drizzle':
      return (
        <g>
          <path d={CLOUD} />
          <path d="M10.5 19.5l-.8 2.2M15 19.5l-.8 2.2" />
        </g>
      );

    case 'rain':
      return (
        <g>
          <path d={CLOUD} />
          <path d="M9.5 19.5l-1 2.9M13 19.5l-1 2.9M16.5 19.5l-1 2.9" />
        </g>
      );

    case 'snow':
      return (
        <g>
          <path d={CLOUD} />
          <path d="M9.5 20.4h.01M13 20.4h.01M16.5 20.4h.01M11.2 23.2h.01M14.8 23.2h.01" />
        </g>
      );

    case 'thunder':
      return (
        <g>
          <path d={CLOUD} />
          <path d="M13 18.8l-3.2 4.2h3l-1 3.2" />
        </g>
      );
  }
}

/**
 * What each drawing needs in order to sit in the middle of the box.
 *
 * The box is bigger than any one icon, because it has to hold the tallest -
 * thunder, at 21 units - and the widest - a sun with its rays, at 19. Left
 * where they were drawn, a sun floated two units high and a moon sat over to
 * the right, so each is moved onto the centre.
 *
 * Whole units, not whatever the measurement said. The exact figures ran to two
 * decimals apiece and read as though someone had nudged each icon until it
 * looked right. Rounded, the furthest any of them sits from the centre is 0.42
 * of a unit - two thirds of a pixel at the usual size, under one at the
 * largest. Ten numbers that can be read at a glance are worth that.
 */
const CENTRING: Record<WeatherIconName, string> = {
  'clear-day': 'translate(0 2)',
  'clear-night': 'translate(-1 2)',
  'partly-day': 'translate(0 2)',
  'partly-night': 'translate(-1 2)',
  cloudy: 'translate(1 2)',
  fog: 'translate(1 1)',
  drizzle: 'translate(1 0)',
  rain: 'translate(1 -1)',
  snow: 'translate(1 -1)',
  thunder: 'translate(1 -3)',
};

/**
 * Drawn with currentColor and no fill, so it takes the surrounding text colour
 * and follows the theme without any extra wiring.
 */
export function WeatherIcon({ name }: WeatherIconProps) {
  return (
    <svg
      class="weather__icon"
      viewBox="0 0 24 26"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <g transform={CENTRING[name]}>
        <Body name={name} />
      </g>
    </svg>
  );
}
