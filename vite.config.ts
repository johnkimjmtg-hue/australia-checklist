import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',   // ← Capacitor 필수: 절대경로 → 상대경로
  build: {
    outDir: 'dist',
  },
})
