import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ BASE ga o'z repo nomingizni yozing!
// Masalan: repo nomi "kitchen-app" bo'lsa → base: '/kitchen-app/'
export default defineConfig({
  plugins: [react()],
  base: '/module/',   // ← BU YERGA O'Z REPO NOMINGIZNI YOZING
})