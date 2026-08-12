import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: { '@': '/src' },
  },
  server: {
    fs: {
      allow: ["../.."]
    },
    port: 5176,
    host: true,
    proxy: {
      '/api': {
        target: 'http://api:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
