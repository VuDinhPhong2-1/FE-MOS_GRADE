import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react/') ||
              id.includes('react-dom/') ||
              id.includes('react-router-dom/') ||
              id.includes('react-router/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('@bug-on/') || id.includes('motion')) {
              return 'vendor-m3';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            if (
              id.includes('xlsx') ||
              id.includes('xlsx-js-style') ||
              id.includes('react-export-table-to-excel')
            ) {
              return 'vendor-excel';
            }
            if (id.includes('axios') || id.includes('jwt-decode')) {
              return 'vendor-core';
            }
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.mos-grader-app.info.vn',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

