import { render } from 'preact';

import { App } from './app';
import { startLocaleSync } from './state/locale';
import { startSettingsSync } from './state/settings';
import { startWeatherSync } from './state/weather';

import './styles/reset.css';
import './styles/themes.css';
import './styles/layout.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('#app not found');
}

startSettingsSync();
startLocaleSync();
startWeatherSync();

render(<App />, root);
