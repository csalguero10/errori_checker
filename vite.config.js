import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🔴 IMPORTANTE: cambia "errori-checker" por el nombre exacto de tu repositorio en GitHub
export default defineConfig({
  plugins: [react()],
  base: '/errori-checker/',
})
