import { settings } from '../state/settings';
import { location, weather } from '../state/weather';

import './Footer.css';

/**
 * The foot of the screen, between the two corner buttons.
 *
 * It exists for one thing: Open-Meteo's licence asks for a link "next to any
 * location Open-Meteo data are displayed". A dashboard is a single screen with
 * nothing below the fold, so the foot of it is next to everything on it.
 *
 * Only while a reading is actually on the screen. Before a place has been
 * chosen, while a fetch is failing, and with the widget switched off entirely,
 * there is nothing of theirs to credit - and an empty bar is not worth the
 * landmark. The last of those matters most: a reading can be sitting in storage
 * while the dashboard shows a clock and nothing else.
 *
 * The wording is Open-Meteo's own and stays in English. It is a credit rather
 * than a part of the interface, which is why it is not in the dictionary with
 * everything else.
 */
export function Footer() {
  if (!settings.value.showWeather || !location.value || !weather.value) {
    return null;
  }

  return (
    <footer class="dashboard__footer">
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
        Weather data by Open-Meteo.com
      </a>
    </footer>
  );
}
