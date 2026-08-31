import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// GitHub Pages project site: https://careermedia.github.io/CareerRaffleMachine/
const GITHUB_PAGES_BASE = '/CareerRaffleMachine/';
const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: GITHUB_PAGES_BASE,
  plugins: [
    react(),
    {
      name: 'github-pages-spa-fallback',
      closeBundle() {
        const outDir = join(rootDir, 'dist');
        copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'));
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
