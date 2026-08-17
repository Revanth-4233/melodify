import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://sonicvault-backend-5w8l.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/jiosaavn-proxy': {
        target: 'https://www.jiosaavn.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jiosaavn-proxy/, ''),
      }
    }
  }
})

