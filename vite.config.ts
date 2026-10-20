import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, join } from 'path'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs'

/**
 * 把构建出来的 js / css 内联进 index.html。
 *
 * 原因：用 file:// 双击打开时，浏览器会以 CORS 策略拦截外部的
 * <script type="module" src="..."> 和 <link rel="stylesheet">（origin 为 null），
 * 结果页面一片空白。内联的模块脚本不发起跨域请求，因此可以正常执行。
 */
function inlineDistAssets(): Plugin {
  return {
    name: 'inline-dist-assets',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const htmlPath = join(distDir, 'index.html')
      if (!existsSync(htmlPath)) return

      const stale: string[] = []
      let html = readFileSync(htmlPath, 'utf-8')

      // 内联样式
      html = html.replace(
        /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
        (tag, href: string) => {
          const file = resolve(distDir, href)
          if (!existsSync(file)) return tag
          stale.push(file)
          return `<style>\n${readFileSync(file, 'utf-8')}\n</style>`
        }
      )

      // 内联脚本（保留 type="module"，内联模块脚本不受 CORS 限制）
      html = html.replace(
        /<script[^>]*src="([^"]+)"[^>]*><\/script>/g,
        (tag, src: string) => {
          const file = resolve(distDir, src)
          if (!existsSync(file)) return tag
          stale.push(file)
          const code = readFileSync(file, 'utf-8').replace(/<\/script/gi, '<\\/script')
          return `<script type="module">\n${code}\n</script>`
        }
      )

      writeFileSync(htmlPath, html)
      for (const file of stale) {
        try {
          rmSync(file)
        } catch {
          /* 已经被内联，删不掉也不影响打开 */
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), inlineDistAssets()],
  // 相对路径，保证打包后可以用 file:// 直接打开 index.html
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 打包成一个 js + 一个 css，便于内联进 index.html
    cssCodeSplit: false,
    // 资源与 index.html 同级，file:// 下相对路径才能正确解析
    assetsDir: '',
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
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
      // 忽略静态图片目录与构建产物/压缩包，避免文件被其他程序占用时触发 EBUSY 导致 dev server 崩溃
      ignored: [
        '**/src/assets/image/**',
        '**/dist/**',
        '**/*.rar',
        '**/*.zip'
      ]
    }
  }
})
