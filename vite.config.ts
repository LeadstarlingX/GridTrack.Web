import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@clerk'))          return 'vendor-clerk'
          if (id.includes('@microsoft/signalr')) return 'vendor-signalr'
          if (id.includes('maplibre-gl') || id.includes('react-map-gl')) return 'vendor-map'
          if (id.includes('recharts'))        return 'vendor-charts'
          if (id.includes('react'))           return 'vendor-react'
        },
      },
    },
  },
})