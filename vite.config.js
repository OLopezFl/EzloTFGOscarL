import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const laravelRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    laravel({
      input: ['src/styles/app.css', 'src/app.jsx'],
      refresh: ['routes/**', 'resources/views/**', 'src/**'],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(laravelRoot, 'src'),
    },
  },
});
