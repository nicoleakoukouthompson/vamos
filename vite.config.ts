import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// VITE_BASE is set to "/<repo>/" for GitHub Pages builds; "./" works for any static host.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  build: { target: 'es2022', sourcemap: false },
});
