import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const enablePwa = process.env.VITE_ENABLE_PWA !== 'false';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    enablePwa && VitePWA({
      // Registro automático del service worker (en lugar del sw.js manual)
      registerType: 'autoUpdate',
      // Estratégia: injectRegister para que el SW se cargue asíncrono sin bloquear el render
      injectRegister: 'auto',
      // Usar el manifest existente (con iconos maskable)
      manifest: false, // false → usa public/manifest.webmanifest
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        // Pre-cache: app shell crítico
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Tamaños máximos de caché
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        // Estrategias de runtime
        runtimeCaching: [
          {
            // API calls: NetworkFirst con timeout corto
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'smd-vital-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 min
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Imágenes: CacheFirst
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'smd-vital-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          {
            // Fuentes: CacheFirst
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'smd-vital-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
          {
            // Rutas de la app: NetworkFirst con fallback a offline.html
            // networkTimeoutSeconds en 15s para tolerar cold start de Render free tier
            // (el contenedor se duerme tras 15min de inactividad y tarda ~10-15s en despertar).
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'smd-vital-pages',
              networkTimeoutSeconds: 15,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 día
              },
            },
          },
        ],
        // Página offline fallback
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      // Hooks del dev: deshabilitar SW en dev para no cachear cosas raras
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4040',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  preview: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    host: true,
  },
});
