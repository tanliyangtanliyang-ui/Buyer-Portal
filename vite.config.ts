import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Unified Farmer/Buyer portal: Farmer/Seller mode loads the existing Farmer app from /farmer/ on this
  // same port. Requests (and its hot-reload websocket) are forwarded to the internal Farmer dev server.
  server: {
    proxy: {
      '/farmer': { target: process.env.FARMER_PORTAL_INTERNAL_URL ?? 'http://127.0.0.1:5105', ws: true },
    },
  },
});
