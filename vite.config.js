import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],

      // Full web app manifest
      manifest: {
        name: 'Scripture Tracker',
        short_name: 'Scriptures',
        description: 'Daily scripture reading tracker — Book of Mormon, New Testament, Old Testament, Doctrine & Covenants',
        theme_color: '#1a4a7a',
        background_color: '#0d1e2e',
        display: 'standalone',          // ← removes browser chrome
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['education', 'lifestyle'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',        // ← Android adaptive icon
          },
        ],
      },

      // Service worker — caches the app shell for offline use
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache scripture JSON fetched from GitHub CDN
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'scripture-text',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
        ],
      },
    }),
  ],
})
