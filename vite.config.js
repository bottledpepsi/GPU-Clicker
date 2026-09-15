import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` is set for GitHub Pages, which serves the repo from a subpath.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/GPU-Clicker/' : '/',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
