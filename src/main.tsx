import { render } from 'preact';

import { App } from './app';
import { startBackgroundSync } from './state/background';
import { startDiagnostics } from './state/diagnostics';
import { startLocaleSync } from './state/locale';
import { startSettingsSync } from './state/settings';
import { startWeatherSync } from './state/weather';

import './styles/reset.css';
import './styles/themes.css';
import './styles/fonts.css';
import './styles/layout.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('#app not found');
}

// First, so that anything the others log is captured
startDiagnostics();

startSettingsSync();
startLocaleSync();
startWeatherSync();
startBackgroundSync();

render(<App />, root);
