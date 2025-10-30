import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://api-gateway:3001'
    }
  },
  build: {
    outDir: 'dist'
  }
});
