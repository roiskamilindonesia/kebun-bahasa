import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Both hosting targets render the same game and learning state machine.
await build({
  configFile: false,
  root: path.join(root, 'github-pages'),
  base: '/kebun-bahasa/',
  publicDir: path.join(root, 'public'),
  resolve: { alias: { '@': root } },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  build: { outDir: path.join(root, 'github-pages-dist'), emptyOutDir: true },
});
