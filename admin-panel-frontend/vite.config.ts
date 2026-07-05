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
            // Rutas de la app: NetworkFirst con timeout amplio para tolerar cold start
            // de Render free tier. Si la red responde, sirve lo nuevo. Si no responde
            // en networkTimeoutSeconds, sirve la version cacheada de index.html
            // (precacheado al instalar el SW) en vez de offline.html.
            //
            // CRITICO: NO usamos navigateFallback='/offline.html' porque genera
            // loops cuando el SW esta atrapado con una version vieja: cada reload
            // cae en offline.html otra vez. Con fallback a index.html (precache)
            // el reload SIEMPRE termina cargando la app, incluso si la red falla.
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
        // Página offline fallback removida a proposito. Ver el comentario
        // arriba en la regla navigate-mode para entender por que.
        // (?_cb= y ?update= NO se cachean — son URL de escape que queremos
        // que siempre vayan a la red al index.html precacheado.)
        navigateFallbackDenylist: [/^\/api\//, /\?_cb=/, /\?update=/],
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
