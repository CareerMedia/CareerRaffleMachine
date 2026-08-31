import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Project site lives at https://<user>.github.io/CareerRaffleMachine/
const BASE = '/CareerRaffleMachine/';
const rootDir = fileURLToPath(new URL('.', import.meta.url));

// Served by GitHub Pages for unknown paths. Rewrites path-style deep links
// (/CareerRaffleMachine/display) onto the hash router (/CareerRaffleMachine/#/display).
const notFoundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CSUN Career Center Raffle</title>
    <script>
      (function () {
        var base = '${BASE}';
        var path = window.location.pathname;
        var rest = path.indexOf(base) === 0 ? path.slice(base.length) : '';
        rest = rest.replace(/^\\/+/, '').replace(/\\/+$/, '');
        var target = base + '#/' + rest + window.location.search;
        window.location.replace(target);
      })();
    </script>
  </head>
  <body></body>
</html>
`;

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    {
      name: 'github-pages-artifacts',
      closeBundle() {
        const outDir = join(rootDir, 'dist');
        writeFileSync(join(outDir, '404.html'), notFoundHtml);
        // Stop GitHub Pages from running the output through Jekyll.
        writeFileSync(join(outDir, '.nojekyll'), '');
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
