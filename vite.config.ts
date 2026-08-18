import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// GitHub Pages serves from a subpath, so every generated URL must be relative
export default defineConfig({
  base: './',
  plugins: [preact()],
});
