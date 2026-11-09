import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // /api goes to the gateway. /profile-service is Profile's photo bucket, so photo uploads and images
  // work through one public URL (the UAT Cloudflare tunnel). changeOrigin must stay false there: the
  // upload URLs are signed for the public host, and the string shorthand would rewrite Host to the
  // target and break the signature. `vite preview` uses the same settings.
  server: {
    proxy: { '/api': 'http://127.0.0.1:8088', '/profile-service': { target: 'http://127.0.0.1:9000', changeOrigin: false } },
    allowedHosts: ['.trycloudflare.com'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
