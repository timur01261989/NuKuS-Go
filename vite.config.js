import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      '@features': '/src/features',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@lib': '/src/lib',
      '@i18n': '/src/i18n',
      '@providers': '/src/providers',
      '@shared': '/src/shared'
    }
  },

  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173 // Portni aniq belgilab qo'yamiz
  },
  optimizeDeps: {
    force: true // Har gal yurgizganda keshni yangilashga majburlash
  }
})