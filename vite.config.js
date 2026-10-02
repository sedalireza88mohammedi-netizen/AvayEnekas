import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // در حالت توسعه، درخواست‌های بک‌اند از همان origin سرو می‌شوند تا رفتار
    // سایت با پروداکشن یکسان باشد (بدون CORS و بدون آدرس localhost ثابت)
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
})