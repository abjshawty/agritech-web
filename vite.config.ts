import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // Same origin as production: the backend runs on :3000 under /api.
    // Point elsewhere with API_URL, e.g. API_URL=http://localhost:3001 bun dev.
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3000' },
  },
})
