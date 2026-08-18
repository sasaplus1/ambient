import { backgroundUrl } from '../state/background';
import { settings } from '../state/settings';

import './Background.css';

export function Background() {
  const url = backgroundUrl.value;
  const { backgroundFit, backgroundOpacity } = settings.value;

  if (!url) {
    return null;
  }

  return (
    <div
      class="background"
      style={{
        '--background-fit': backgroundFit,
        '--background-opacity': String(backgroundOpacity / 100),
      }}
    >
      <img class="background__image" src={url} alt="" />
    </div>
  );
}
