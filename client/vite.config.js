import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              priority: 30,
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor-icons',
              priority: 20,
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            },
            {
              name: 'vendor-socket',
              priority: 10,
              test: /[\\/]node_modules[\\/](socket\.io-client|socket\.io-parser|engine\.io-client|engine\.io-parser|@socket\.io)[\\/]/,
            },
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
})

