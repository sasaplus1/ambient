import { gradientCss } from '../lib/gradients';
import { backgroundUrl } from '../state/background';
import { settings } from '../state/settings';

import './Background.css';

export function Background() {
  const { backgroundKind, backgroundGradient, backgroundFit, backgroundDim } =
    settings.value;

  if (backgroundKind === 'none') {
    return null;
  }

  const url = backgroundUrl.value;
  const gradient = gradientCss(backgroundGradient);

  // Nothing chosen yet, so fall through to the plain theme colour
  if (backgroundKind === 'image' && !url) {
    return null;
  }

  return (
    <div class="background">
      {backgroundKind === 'image' && url ? (
        <img
          class="background__image"
          style={{ '--background-fit': backgroundFit }}
          src={url}
          alt=""
        />
      ) : (
        <div class="background__gradient" style={{ backgroundImage: gradient }} />
      )}

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
