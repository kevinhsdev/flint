/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_NAME } from './src/brand.ts';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    { name: 'app-name', transformIndexHtml: html => html.replaceAll('%APP_NAME%', APP_NAME) },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        lang: 'pt-BR',
        display: 'standalone',
        start_url: './',
        background_color: '#0E0A12',
        theme_color: '#0E0A12',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    // telas que abrem o banco ficam lentas com muitos arquivos jsdom em paralelo
    testTimeout: 30_000,
    maxWorkers: 4,
  },
});
