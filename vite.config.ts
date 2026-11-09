import { defineConfig } from 'vite';

// GitHub Pages serves the site from https://<user>.github.io/moon_field/,
// so built asset paths must be relative to that folder.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/moon_field/' : '/',
  // Phaser alone is ~1.3 MB minified; the default 500 kB warning is noise here.
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
