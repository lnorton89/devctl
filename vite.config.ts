import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:4002';
const apiProxyToken = process.env.VITE_API_PROXY_TOKEN;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        ...(apiProxyToken
          ? { headers: { 'x-devctl-host-token': apiProxyToken } }
          : {}),
      },
    },
  },
  build: {
    outDir: 'dist/client',
  },
});
