import { render } from 'preact';

import { App } from './app';
import { applyTheme, DEFAULT_THEME } from './lib/theme';

import './styles/reset.css';
import './styles/themes.css';
import './styles/layout.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('#app not found');
}

applyTheme(DEFAULT_THEME);

render(<App />, root);
