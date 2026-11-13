import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative base + hash routing: the same build works on GitHub Pages project sites,
// Cloudflare Pages, and from a local file server.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022', sourcemap: false },
});
