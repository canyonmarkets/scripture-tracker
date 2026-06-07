import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest lets us use a custom SW with push notification support
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },

      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],

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

    }),
  ],
})
