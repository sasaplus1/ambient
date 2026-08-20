import { useState } from 'preact/hooks';

import { logger } from '../lib/logger';
import { backgroundUrl } from '../state/background';
import { settings } from '../state/settings';

import './Background.css';

/**
 * The picture the user supplied, if there is one.
 *
 * A theme's own gradient is not drawn here: that belongs to the theme and is
 * painted on the body, alongside the colours it was balanced against.
 */
export function Background() {
  const url = backgroundUrl.value;
  const { backgroundFit, backgroundDim } = settings.value;

  /*
   * Which URL failed, rather than a flag, so that choosing another picture
   * clears this on its own - a new URL is not the one that failed.
   *
   * Nothing should reach here now that a picture is decoded before it is
   * stored, but one saved before that check existed still can, and so can an
   * image that stops being readable later.
   */
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  /*
   * Fall back to the theme rather than leave the broken-image mark standing.
   * This is a display on a wall for days at a time; a small grey icon in the
   * corner of the wallpaper is worse than no wallpaper, and the log is where
   * the fact belongs.
   */
  if (!url || url === brokenUrl) {
    return null;
  }

  return (
    <div class="background">
      <img
        class="background__image"
        style={{ '--background-fit': backgroundFit }}
        src={url}
        alt=""
        onError={() => {
          logger.error('background', 'the stored image could not be decoded');
          setBrokenUrl(url);
        }}
      />

      {/*
        Dimmed towards the theme's own background colour, so the contrast the
        theme was built for comes back. Darkening would be wrong under Light.
      */}
      <div
        class="background__scrim"
        style={{ opacity: String(backgroundDim / 100) }}
      />
    </div>
  );
}
