import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['team-041.hackaton.sivas.edu.tr'],
    host: true,
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
  }
  }
})
