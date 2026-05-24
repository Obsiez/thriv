import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Optional Netlify: proxy /api when VITE_API_URL is set */
function netlifyRedirects() {
  return {
    name: 'netlify-redirects',
    closeBundle() {
      const api = process.env.VITE_API_URL?.trim().replace(/\/$/, '')
      if (!api) return
      writeFileSync(
        resolve(__dirname, 'dist', '_redirects'),
        `/api/*  ${api}/api/:splat  200\n/*    /index.html  200\n`
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), netlifyRedirects()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
