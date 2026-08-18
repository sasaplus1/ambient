import { render } from 'preact';

import { App } from './app';
import { startSettingsSync } from './state/settings';

import './styles/reset.css';
import './styles/themes.css';
import './styles/layout.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('#app not found');
}

startSettingsSync();

render(<App />, root);
