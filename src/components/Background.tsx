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

  if (!url) {
    return null;
  }

  return (
    <div class="background">
      <img
        class="background__image"
        style={{ '--background-fit': backgroundFit }}
        src={url}
        alt=""
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
