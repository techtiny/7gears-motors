// v2
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow WhatsApp-friendly hostnames for the customer approval link,
    // e.g. http://192-168-1-10.nip.io:5174 (nip.io maps that name to the LAN IP)
    allowedHosts: ['.nip.io'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
