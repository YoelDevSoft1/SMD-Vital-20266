import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    host: true, // Permite acceso desde fuera del contenedor
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // No reescribir la ruta
      },
    },
  },
  preview: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    host: true,
  },
});
