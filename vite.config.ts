import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: "/MES/",
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    watch: {
      // 忽略静态图片目录，避免文件被其他程序占用时触发 EBUSY 导致 dev server 崩溃
      ignored: ['**/src/assets/image/**']
    }
  }
})
